import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, getDocs, deleteDoc, query, updateDoc } from 'firebase/firestore';
import { ChevronDown, CheckCircle2, Circle, Calendar, ListChecks, ChevronLeft, ChevronRight, Dumbbell, Plus, Trash2, X, PlayCircle, PlusCircle, Sun, Moon, BarChart2, Flame, Edit, Wind, Zap, HeartPulse, Award, User, Target, Clock, Route, Zap as WorkoutIcon, Activity as SingleActivityIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// --- Firebase Configuration ---
// These variables are expected to be injected by the environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- App Data ---
const exerciseCategories = ['Upper Body', 'Lower Body', 'Core', 'Cardio', 'Full Body'];
const activityCategories = ['Workout', 'Cardio', 'Sport'];
const activityIcons = { Dumbbell, Wind, Zap, HeartPulse, Flame, Target };
const iconNames = Object.keys(activityIcons);

const masterExerciseList = [
  // Lower Body
  { id: 'ex01', name: 'Goblet Squat', details: 'Hold one dumbbell vertically against your chest. Stand with feet slightly wider than shoulder-width. Lower your hips back and down. Drive through your heels to return.', category: 'Lower Body' },
  { id: 'ex04', name: 'Glute Bridge (Weighted)', details: 'Lie on your back, knees bent. Place a dumbbell on your hips. Squeeze glutes to lift hips until your body is a straight line from shoulders to knees.', category: 'Lower Body' },
  { id: 'ex06', name: 'Romanian Deadlifts (RDLs)', details: 'Slight bend in knees, hinge at hips pushing glutes back. Lower dumbbells down your legs with a flat back. Squeeze glutes to stand up.', category: 'Lower Body' },
  { id: 'ex08', name: 'Bulgarian Split Squat', details: 'Rear foot on a bench. Lower until your front thigh is parallel to the floor. Complete all reps on one side before switching.', category: 'Lower Body' },
  { id: 'ex11', name: 'Dumbbell Lunges', details: 'Step forward and lower hips until both knees are at a 90-degree angle. Push off the front foot to return. Alternate legs.', category: 'Lower Body' },
  { id: 'ex14', name: 'Band Lateral Walks', details: 'Band around ankles/knees. In a half-squat, step sideways, keeping tension on the band.', category: 'Lower Body' },
  { id: 'ex25', name: 'Calf Raises', details: 'Stand holding dumbbells at your sides. Push through the balls of your feet to raise your heels as high as possible. Pause, then lower.', category: 'Lower Body' },
  { id: 'ex30', name: 'Squat Jumps', details: 'Perform a regular bodyweight squat, but explode upwards into a jump. Land softly and immediately go into the next squat.', category: 'Cardio' },
  { id: 'ex31', name: 'Box Jumps', details: 'Stand in front of a sturdy box or bench. Jump up, landing softly on both feet. Step back down.', category: 'Lower Body' },
  { id: 'ex32', name: 'Hip Thrusts (Weighted)', details: 'Rest your upper back on a bench, with your feet on the floor. Place a dumbbell or barbell across your hips. Drive your hips up, squeezing your glutes.', category: 'Lower Body' },

  // Upper Body
  { id: 'ex02', name: 'Push-ups', details: 'High plank position, hands under shoulders. Lower your body until your chest is just above the floor. Push back up forcefully. Modify by putting knees on the floor if needed.', category: 'Upper Body' },
  { id: 'ex03', name: 'Bent-Over Dumbbell Row', details: 'Hinge at your hips with a straight back. Pull dumbbells up towards your chest, squeezing shoulder blades. Lower with control.', category: 'Upper Body' },
  { id: 'ex07', name: 'Dumbbell Bench Press', details: 'Lie on a bench, press dumbbells straight up from your chest. Lower slowly. Can be done on the floor.', category: 'Upper Body' },
  { id: 'ex09', name: 'Resistance Band Pull-Apart', details: 'Hold a band with arms straight out. Pull the band apart by squeezing your shoulder blades.', category: 'Upper Body' },
  { id: 'ex12', name: 'Overhead Press', details: 'From shoulder height, press dumbbells straight overhead. Lower back to shoulders with control. Keep core tight.', category: 'Upper Body' },
  { id: 'ex13', name: 'Single-Arm Dumbbell Row', details: 'Support yourself on a bench. Pull a dumbbell up to your chest with a flat back. Complete all reps on one side before switching.', category: 'Upper Body' },
  { id: 'ex23', name: 'Bicep Curls', details: 'Stand or sit, holding dumbbells at your sides, palms facing forward. Curl the weights up to your shoulders, keeping your elbows stationary. Lower with control.', category: 'Upper Body' },
  { id: 'ex24', name: 'Tricep Kickbacks', details: 'Hinge at the hips with a flat back, supporting yourself with one hand on a bench. Hold a dumbbell in the other hand with your elbow bent at 90 degrees. Extend your arm straight back, squeezing your tricep. Return to the start.', category: 'Upper Body' },
  { id: 'ex27', name: 'Face Pulls (Band)', details: 'Anchor a resistance band at chest height. Pull the band towards your face, leading with your hands and squeezing your rear deltoids.', category: 'Upper Body' },
  { id: 'ex33', name: 'Incline Dumbbell Press', details: 'Lie on an incline bench. Press dumbbells up from your upper chest. This targets the upper pecs more.', category: 'Upper Body' },
  { id: 'ex34', name: 'Pull-ups / Chin-ups', details: 'Hang from a bar. Pull your chest up to the bar. Use assistance bands or a machine if needed.', category: 'Upper Body' },
  { id: 'ex35', name: 'Dumbbell Lateral Raises', details: 'Stand with dumbbells at your sides. Raise your arms out to the sides until they are parallel with the floor. Lower with control.', category: 'Upper Body' },
  { id: 'ex36', name: 'Dips', details: 'Using parallel bars or a sturdy bench, lower your body until your elbows are at a 90-degree angle, then press back up.', category: 'Upper Body' },

  // Core
  { id: 'ex05', name: 'Plank', details: 'Hold a straight line from head to heels on your forearms. Engage core and glutes.', category: 'Core' },
  { id: 'ex10', name: 'Lying Leg Raises', details: 'Lie on your back, raise legs straight up to perpendicular, then lower slowly without touching the floor.', category: 'Core' },
  { id: 'ex15', name: 'Side Plank', details: 'Prop yourself up on your forearm, creating a straight line from ankles to head. Hold.', category: 'Core' },
  { id: 'ex26', name: 'Russian Twists', details: 'Sit on the floor, leaning back with your knees bent. Hold a dumbbell with both hands. Twist your torso from side to side, tapping the dumbbell on the floor next to you.', category: 'Core' },
  { id: 'ex37', name: 'Hanging Knee Raises', details: 'Hang from a pull-up bar. Raise your knees up towards your chest without swinging. Lower slowly.', category: 'Core' },
  { id: 'ex38', name: 'Crunches', details: 'Lie on your back with knees bent. Lift your upper back off the floor. Focus on using your abs.', category: 'Core' },
  { id: 'ex39', name: 'Bird-Dog', details: 'Start on all fours. Extend your right arm forward and your left leg back simultaneously. Keep your core tight and back flat. Alternate sides.', category: 'Core' },

  // Full Body / Cardio
  { id: 'ex16', name: 'Dumbbell Thrusters', details: 'Hold two dumbbells at your shoulders. Drop into a full squat, and as you drive back up, use the momentum to press the dumbbells overhead.', category: 'Full Body' },
  { id: 'ex17', name: 'Burpees', details: 'From a standing position, drop into a squat, place your hands on the floor, kick your feet back into a plank, perform a push-up, jump your feet back to your hands, and explosively jump up with your arms overhead.', category: 'Full Body' },
  { id: 'ex20', name: 'Dumbbell Swings', details: 'Hold one end of a dumbbell with both hands. Hinge at your hips, letting the dumbbell swing back between your legs. Then, explosively thrust your hips forward to swing the dumbbell up to chest height. This is a hip movement, not an arm lift.', category: 'Full Body' },
  { id: 'ex40', name: 'Mountain Climbers', details: 'In a high plank position, alternate driving your knees towards your chest as if you are running in place.', category: 'Cardio' },
  { id: 'ex41', name: 'Jumping Jacks', details: 'A classic cardio move. Jump your feet out wide while raising your arms overhead.', category: 'Cardio' },
  { id: 'ex42', name: 'High Knees', details: 'Run in place, bringing your knees up as high as possible.', category: 'Cardio' },
  { id: 'ex43', name: 'Man Makers', details: 'A complex move: from a plank, do a push-up, then a row with each arm, jump feet in, and stand up into a dumbbell press.', category: 'Full Body' },
];

const defaultHabits = [
    { id: 'hydrate', name: 'Drink 3L Water' },
    { id: 'sleep', name: 'Sleep 7.5+ Hours' },
    { id: 'protein', name: 'Hit Protein Goal' },
];

const exampleActivities = [
    { name: 'Full Body Strength', category: 'Workout', description: 'A balanced workout hitting all major muscle groups.', exercises: masterExerciseList.filter(e => ['Goblet Squat', 'Dumbbell Bench Press', 'Bent-Over Dumbbell Row', 'Overhead Press', 'Plank'].includes(e.name)), icon: 'Dumbbell' },
    { name: 'Push Day', category: 'Workout', description: 'Focus on chest, shoulders, and triceps.', exercises: masterExerciseList.filter(e => ['Push-ups', 'Incline Dumbbell Press', 'Overhead Press', 'Dumbbell Lateral Raises', 'Dips'].includes(e.name)), icon: 'Dumbbell' },
    { name: 'Pull Day', category: 'Workout', description: 'Focus on back and biceps.', exercises: masterExerciseList.filter(e => ['Pull-ups / Chin-ups', 'Bent-Over Dumbbell Row', 'Single-Arm Dumbbell Row', 'Face Pulls (Band)', 'Bicep Curls'].includes(e.name)), icon: 'Dumbbell' },
    { name: 'Leg Day', category: 'Workout', description: 'A challenging lower body and core session.', exercises: masterExerciseList.filter(e => ['Goblet Squat', 'Romanian Deadlifts (RDLs)', 'Bulgarian Split Squat', 'Calf Raises', 'Lying Leg Raises'].includes(e.name)), icon: 'Dumbbell' },
    { name: 'HIIT Cardio', category: 'Cardio', description: 'High-Intensity Interval Training for maximum calorie burn.', exercises: masterExerciseList.filter(e => ['Burpees', 'Squat Jumps', 'Mountain Climbers', 'High Knees', 'Jumping Jacks'].includes(e.name)), icon: 'Flame' },
    { name: 'Steady Run', category: 'Cardio', description: 'A distance-focused cardio session.', icon: 'Wind', exercises: [] },
    { name: 'Tennis Match', category: 'Sport', description: 'A competitive or casual game.', icon: 'Target', exercises: [] },
];

// --- Helper Functions ---
const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to make Monday the first day of the week
    return new Date(d.setDate(diff));
};

const getStartOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};


const formatDateWithOrdinal = (date) => {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    return `${month} ${day}${suffix}`;
};

// --- Custom Hooks ---
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

// --- Components ---

const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-4 border dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
            <div className="flex justify-end gap-4">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 font-semibold">Confirm</button>
            </div>
        </div>
    </div>
);

const ExerciseItem = ({ exercise, isChecked, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center">
          <button onClick={(e) => { e.stopPropagation(); onToggle(exercise.name); }} className="mr-4 focus:outline-none">
            {isChecked ? <CheckCircle2 className="w-6 h-6 text-blue-500" /> : <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />}
          </button>
          <span className="font-medium text-lg text-gray-800 dark:text-gray-100">{exercise.name}</span>
        </div>
        <ChevronDown className={`w-6 h-6 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && <div className="p-4 pt-0 pl-14"><p className="text-gray-600 dark:text-gray-400">{exercise.details}</p></div>}
    </div>
  );
};

const ActivityChecklistModal = ({ day, onClose, activityProgress, setActivityProgress, customActivities, activityLogs, setActivityLogs, onConfirmDelete }) => {
  const activity = customActivities.find(w => w.id === day.activityId);
  if (!activity) return null;
 
  const hasExercises = activity.exercises && activity.exercises.length > 0;
  const dateProgress = activityProgress[day.date]?.[day.instanceId] || {};
 
  const isWorkoutComplete = hasExercises && activity.exercises.every(ex => dateProgress[ex.name]);
  const isSingleActivityComplete = !hasExercises && activityLogs[day.date]?.some(log => log.instanceId === day.instanceId);
  const isComplete = isWorkoutComplete || isSingleActivityComplete;

  const [duration, setDuration] = useState(activityLogs[day.date]?.find(l => l.instanceId === day.instanceId)?.duration || '');
  const [distance, setDistance] = useState(activityLogs[day.date]?.find(l => l.instanceId === day.instanceId)?.distance || '');
  const [calories, setCalories] = useState(activityLogs[day.date]?.find(l => l.instanceId === day.instanceId)?.calories || '');

  const handleStatSave = (isCompleting) => {
    setActivityLogs(prev => {
        const dayLogs = prev[day.date] || [];
        if (!isCompleting) { // If unchecking, remove the log
            const filteredLogs = dayLogs.filter(log => log.instanceId !== day.instanceId);
            if (filteredLogs.length === 0) {
                const newLogs = {...prev};
                delete newLogs[day.date];
                return newLogs;
            }
            return { ...prev, [day.date]: filteredLogs };
        }
       
        const newLog = { 
            instanceId: day.instanceId,
            activityId: day.activityId,
            duration: parseFloat(duration) || null,
            distance: parseFloat(distance) || null,
            calories: parseFloat(calories) || null,
        };
        const filteredLogs = dayLogs.filter(log => log.instanceId !== day.instanceId);
        return { ...prev, [day.date]: [...filteredLogs, newLog] };
    });
  }
 
  const handleToggle = (exerciseName) => {
    const newProgress = { ...activityProgress };
    if (!newProgress[day.date]) newProgress[day.date] = {};
    if (!newProgress[day.date][day.instanceId]) newProgress[day.date][day.instanceId] = {};
    newProgress[day.date][day.instanceId][exerciseName] = !newProgress[day.date][day.instanceId][exerciseName];
   
    const allChecked = activity.exercises.every(ex => newProgress[day.date][day.instanceId][ex.name]);
    if (allChecked) { // Only save stats when completing the whole workout
        handleStatSave(true);
    } else { // If unchecking one, remove the log
        handleStatSave(false);
    }
    setActivityProgress(newProgress);
  };
 
  const handleHeaderToggle = () => {
    if(hasExercises) {
        const newProgress = { ...activityProgress };
        if (!newProgress[day.date]) newProgress[day.date] = {};
        if (!newProgress[day.date][day.instanceId]) newProgress[day.date][day.instanceId] = {};
       
        const isCurrentlyComplete = activity.exercises.every(ex => dateProgress[ex.name]);
        activity.exercises.forEach(ex => {
            newProgress[day.date][day.instanceId][ex.name] = !isCurrentlyComplete;
        });
        handleStatSave(!isCurrentlyComplete);
        setActivityProgress(newProgress);
    } else {
        handleStatSave(!isComplete);
    }
  };

  const handleDelete = () => {
      onConfirmDelete(() => {
          onClose(); // Close the modal first
      });
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-8rem)] flex flex-col border dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button onClick={handleHeaderToggle} className="p-2 text-gray-500 hover:text-blue-500">
                {isComplete ? <CheckCircle2 size={28}/> : <Circle size={28}/>}
            </button>
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{activity.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{new Date(day.date.replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white"><X size={28}/></button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {hasExercises ? (
            <>
                {activity.exercises.map((ex, index) => <ExerciseItem key={index} exercise={ex} isChecked={!!dateProgress[ex.name]} onToggle={handleToggle} />)}
                <div className="p-4 space-y-4 border-t dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Workout Stats</label>
                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} onBlur={() => handleStatSave(isComplete)} placeholder="Time (minutes)" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
                    <input type="number" value={calories} onChange={e => setCalories(e.target.value)} onBlur={() => handleStatSave(isComplete)} placeholder="Calories Burned" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
                </div>
            </>
          ) : (
            <div className="p-4 space-y-4">
                { (activity.category === 'Cardio' || activity.category === 'Sport' || activity.category === 'Workout') && <input type="number" value={duration} onChange={e => setDuration(e.target.value)} onBlur={() => handleStatSave(isComplete)} placeholder="Time (minutes)" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"/>}
                { activity.category === 'Cardio' && <input type="number" value={distance} onChange={e => setDistance(e.target.value)} onBlur={() => handleStatSave(isComplete)} placeholder="Distance (km)" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"/>}
                <input type="number" value={calories} onChange={e => setCalories(e.target.value)} onBlur={() => handleStatSave(isComplete)} placeholder="Calories Burned" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
             <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 font-semibold flex items-center gap-2"><Trash2 size={16}/> Remove from Calendar</button>
        </div>
      </div>
    </div>
  );
};

const AssignActivityModal = ({ date, onClose, customActivities, setCalendarSchedule }) => {
    const handleAssign = (activityId) => {
        const newScheduleEntry = { activityId, instanceId: `inst_${Date.now()}` };
        setCalendarSchedule(prev => {
            const daySchedule = prev[date] ? [...prev[date]] : [];
            daySchedule.push(newScheduleEntry);
            return {...prev, [date]: daySchedule };
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border dark:border-gray-700 flex flex-col max-h-[calc(100vh-8rem)]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Activity</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white"><X size={24}/></button>
                </div>
                <div className="p-4 overflow-y-auto">
                    {customActivities.map(activity => (
                        <button key={activity.id} onClick={() => handleAssign(activity.id)}
                                className="w-full text-left p-4 mb-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                            <h3 className="font-bold text-gray-800 dark:text-white">{activity.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{activity.exercises && activity.exercises.length > 0 ? `${activity.exercises.length} exercises` : activity.category}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CalendarView = ({ activityProgress, customActivities, calendarSchedule, setCalendarSchedule, onStartActivity, onConfirmDelete, quickComplete, view, setView, activityLogs }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarGrid, setCalendarGrid] = useState([]);
    const [assigningToDate, setAssigningToDate] = useState(null);
    const todayString = formatDate(new Date());
    const isMobile = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        const grid = [];
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
       
        if (view === 'month' && !isMobile) {
            const firstDayOfMonth = new Date(year, month, 1);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            let dayOfWeekOfFirst = firstDayOfMonth.getDay();
            dayOfWeekOfFirst = dayOfWeekOfFirst === 0 ? 6 : dayOfWeekOfFirst - 1;

            for (let i = 0; i < dayOfWeekOfFirst; i++) grid.push({ key: `empty-${i}`, empty: true });
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(year, month, i);
                grid.push({ key: formatDate(date), date: formatDate(date), day: i });
            }
        } else { // Week view (for both mobile and desktop)
            const startOfWeek = getStartOfWeek(currentDate);
            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                grid.push({ key: formatDate(date), date: formatDate(date), day: date.getDate(), monthName: date.toLocaleString('default', { month: 'short' }) });
            }
        }
        setCalendarGrid(grid);
    }, [currentDate, view, isMobile]);

    const changeDate = (amount) => setCurrentDate(prev => {
        const newDate = new Date(prev);
        if (view === 'month' && !isMobile) {
            newDate.setMonth(newDate.getMonth() + amount);
        } else {
            newDate.setDate(newDate.getDate() + (amount * 7));
        }
        return newDate;
    });

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const effectiveView = isMobile ? 'week' : view;

    return (
        <div className="bg-white dark:bg-gray-800/50 p-4 sm:p-6 rounded-2xl shadow-lg border dark:border-gray-700">
            {assigningToDate && <AssignActivityModal date={assigningToDate} onClose={() => setAssigningToDate(null)} customActivities={customActivities} setCalendarSchedule={setCalendarSchedule} />}
            <div className="flex justify-between items-center mb-6 gap-2">
                <button onClick={() => changeDate(-1)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"><ChevronLeft className="text-gray-700 dark:text-gray-300"/></button>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-center flex-grow">{effectiveView === 'month' ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : `Week of ${getStartOfWeek(currentDate).toLocaleString('default', { month: 'short', day: 'numeric' })}`}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {!isMobile && (
                        <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
                           <button onClick={() => setView('week')} className={`px-3 py-1 text-sm rounded-full ${view === 'week' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Week</button>
                           <button onClick={() => setView('month')} className={`px-3 py-1 text-sm rounded-full ${view === 'month' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Month</button>
                        </div>
                    )}
                     <button onClick={() => changeDate(1)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronRight className="text-gray-700 dark:text-gray-300"/></button>
                </div>
            </div>
           
            {effectiveView === 'week' && !isMobile && (
                 <div className="grid grid-cols-7 gap-1 text-center text-gray-500 dark:text-gray-400 font-bold mb-2 sm:mb-4">
                    {daysOfWeek.map(day => <div key={day} className="text-xs sm:text-base">{day}</div>)}
                </div>
            )}
             {effectiveView === 'month' && (
                 <div className="grid grid-cols-7 gap-1 text-center text-gray-500 dark:text-gray-400 font-bold mb-2 sm:mb-4">
                    {daysOfWeek.map(day => <div key={day} className="text-xs sm:text-base">{day.substring(0,1)}</div>)}
                </div>
            )}

            <div className={`grid ${effectiveView === 'week' ? 'grid-cols-1 md:grid-cols-7' : 'grid-cols-7'} gap-2`}>
                {calendarGrid.map(day => {
                    if (day.empty) return <div key={day.key} className="rounded-lg aspect-square"></div>;

                    const schedule = calendarSchedule[day.date] || [];
                    const isToday = day.date === todayString;
                    const dateObj = new Date(day.date.replace(/-/g, '/'));
                   
                    const isDayCompleted = schedule.length > 0 && schedule.every(instance => {
                        const activity = customActivities.find(w => w.id === instance.activityId);
                        if (!activity) return false;
                         if(activity.exercises && activity.exercises.length > 0){
                              const progress = activityProgress[day.date]?.[instance.instanceId] || {};
                              return activity.exercises && Object.keys(progress).length === activity.exercises.length && activity.exercises.every(ex => progress[ex.name]);
                         } else {
                              return activityLogs[day.date]?.some(log => log.instanceId === instance.instanceId);
                         }
                    });

                    if (isMobile) { // Mobile Vertical Week View
                         return (
                             <div key={day.key} className={`p-3 rounded-lg flex gap-4 items-start ${isDayCompleted ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-50 dark:bg-gray-800'} ${isToday ? 'border-2 border-blue-500' : 'border-transparent'}`}>
                                 <div className="flex flex-col items-center flex-shrink-0 w-12">
                                     <span className="text-xs text-gray-500 dark:text-gray-400">{dateObj.toLocaleString('default', { weekday: 'short' })}</span>
                                     <span className={`font-bold text-xl ${isToday ? 'text-blue-500' : 'text-gray-800 dark:text-white'}`}>{day.day}</span>
                                 </div>
                                 <div className="flex-grow space-y-2 min-w-0">
                                      {schedule.length > 0 ? schedule.map(s => {
                                         const activity = customActivities.find(w => w.id === s.activityId);
                                         const Icon = activity?.icon ? activityIcons[activity.icon] : Dumbbell;
                                         let isInstanceCompleted = false;
                                         if(activity?.exercises && activity.exercises.length > 0){
                                             const progress = activityProgress[day.date]?.[s.instanceId] || {};
                                             isInstanceCompleted = activity.exercises && Object.keys(progress).length === activity.exercises.length && activity.exercises.every(ex => progress[ex.name]);
                                         } else {
                                             isInstanceCompleted = activityLogs[day.date]?.some(log => log.instanceId === s.instanceId);
                                         }
                                         return (
                                              <div key={s.instanceId} className={`flex items-center justify-between p-2 rounded transition-colors group ${isInstanceCompleted ? 'bg-green-200 dark:bg-green-800/60' : 'bg-gray-200 dark:bg-gray-700/80'}`}>
                                                   <button onClick={() => onStartActivity(day.date, s)} className="font-semibold truncate text-left flex-grow text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-2 min-w-0">
                                                       <Icon size={16} className="flex-shrink-0"/>
                                                       <span className="truncate">{activity?.name || '...'}</span>
                                                   </button>
                                                   <button onClick={() => quickComplete(day.date, s.instanceId, activity)} className="text-gray-400 dark:text-gray-500 hover:text-blue-500 flex-shrink-0 ml-1">
                                                       {isInstanceCompleted ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
                                                   </button>
                                              </div>
                                         )
                                      }) : <p className="text-sm text-gray-400 dark:text-gray-500 h-full flex items-center">Rest Day</p>}
                                 </div>
                                 <button onClick={() => setAssigningToDate(day.date)} className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 self-start"><PlusCircle size={20}/></button>
                             </div>
                         );
                    }

                    // Desktop Grid View (Month or Week)
                    return (
                        <div key={day.key}
                             className={`rounded-lg transition-all duration-200 relative group aspect-square ${isDayCompleted ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-50 dark:bg-gray-800'} ${isToday ? 'border-2 border-blue-500' : 'border-transparent'}`}>
                            <div className="p-1 sm:p-2 flex flex-col h-full">
                                <div className="flex justify-between items-center">
                                    <span className={`font-bold text-sm ${isToday ? 'text-blue-500' : 'text-gray-800 dark:text-white'}`}>{day.day}</span>
                                    <button onClick={() => setAssigningToDate(day.date)} className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"><PlusCircle size={18}/></button>
                                </div>
                                <div className="text-xs mt-1 flex-grow overflow-y-auto no-scrollbar space-y-1">
                                    {schedule.map(s => {
                                        const activity = customActivities.find(w => w.id === s.activityId);
                                        const Icon = activity?.icon ? activityIcons[activity.icon] : Dumbbell;
                                        let isInstanceCompleted = false;
                                        if(activity?.exercises && activity.exercises.length > 0){
                                            const progress = activityProgress[day.date]?.[s.instanceId] || {};
                                            isInstanceCompleted = activity.exercises && Object.keys(progress).length === activity.exercises.length && activity.exercises.every(ex => progress[ex.name]);
                                        } else {
                                            isInstanceCompleted = activityLogs[day.date]?.some(log => log.instanceId === s.instanceId);
                                        }
                                        return (
                                            <div key={s.instanceId} className={`flex items-center justify-between p-1 rounded transition-colors group/item ${isInstanceCompleted ? 'bg-green-200 dark:bg-green-800/60' : 'bg-gray-200 dark:bg-gray-700/80'}`}>
                                                <button onClick={() => onStartActivity(day.date, s)} className="font-semibold truncate text-left flex-grow text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-1">
                                                    <Icon size={12} />
                                                    <span className="hidden sm:inline">{activity?.name || '...'}</span>
                                                </button>
                                                <button onClick={() => quickComplete(day.date, s.instanceId, activity)} className="text-gray-400 dark:text-gray-500 hover:text-blue-500 flex-shrink-0 ml-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    {isInstanceCompleted ? <CheckCircle2 size={16}/> : <Circle size={16}/>}
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CreateOrEditActivityModal = ({ onClose, onActivitySaved, allExercises, activityToEdit, onCustomExerciseClick }) => {
    const [activityName, setActivityName] = useState(activityToEdit?.name || '');
    const [description, setDescription] = useState(activityToEdit?.description || '');
    const [selectedExercises, setSelectedExercises] = useState(activityToEdit?.exercises?.reduce((acc, ex) => ({...acc, [ex.id]: true}), {}) || {});
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedIcon, setSelectedIcon] = useState(activityToEdit?.icon || iconNames[0]);
    const [hasExercises, setHasExercises] = useState(activityToEdit ? (activityToEdit.exercises && activityToEdit.exercises.length > 0) : true);
    const [activityCategory, setActivityCategory] = useState(activityToEdit?.category || 'Workout');

    const handleToggleExercise = (exId) => setSelectedExercises(prev => ({...prev, [exId]: !prev[exId]}));

    const handleSaveActivity = async () => {
        if (!activityName.trim()) return;
       
        let activityData = {
            name: activityName,
            description,
            icon: selectedIcon,
            category: activityCategory,
            exercises: []
        };

        if (hasExercises) {
            const exercises = allExercises.filter(ex => selectedExercises[ex.id]);
            activityData.exercises = exercises;
            // Ensure workout category for activities with exercises
            activityData.category = 'Workout';
        }

        onActivitySaved(activityData, activityToEdit?.id);
        onClose();
    };
   
    const filteredExercises = activeCategory === 'All' ? allExercises : allExercises.filter(ex => ex.category === activeCategory);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-8rem)] flex flex-col border dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{activityToEdit?.id ? 'Edit Activity' : 'Create New Activity'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white"><X size={24}/></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <input type="text" value={activityName} onChange={e => setActivityName(e.target.value)} placeholder="Activity Name (e.g., Push Day)"
                           className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"/>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..."
                              className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white h-20 resize-none border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"></textarea>
                   
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                        <select value={activityCategory} onChange={e => setActivityCategory(e.target.value)} disabled={hasExercises} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50">
                            {activityCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                         {hasExercises && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Category is automatically set to 'Workout' when exercises are added.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                        <div className="flex flex-wrap gap-2">
                            {iconNames.map(iconName => {
                                const Icon = activityIcons[iconName];
                                return (
                                    <button key={iconName} onClick={() => setSelectedIcon(iconName)} className={`p-2 rounded-lg ${selectedIcon === iconName ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                        <Icon/>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Exercises?</label>
                        <button onClick={() => setHasExercises(!hasExercises)} className={`w-12 h-6 rounded-full p-1 transition-colors ${hasExercises ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <span className={`block w-4 h-4 rounded-full bg-white transform transition-transform ${hasExercises ? 'translate-x-6' : ''}`}/>
                        </button>
                    </div>

                    {hasExercises && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setActiveCategory('All')} className={`px-3 py-1 text-sm rounded-full ${activeCategory === 'All' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>All</button>
                                {exerciseCategories.map(cat => (
                                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 text-sm rounded-full ${activeCategory === cat ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{cat}</button>
                                ))}
                            </div>

                            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                                {filteredExercises.map(ex => (
                                    <div key={ex.id} onClick={() => handleToggleExercise(ex.id)}
                                         className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedExercises[ex.id] ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                                        <div className={`w-5 h-5 mr-4 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedExercises[ex.id] ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-500'}`}>
                                            {selectedExercises[ex.id] && <CheckCircle2 size={16} className="text-white"/>}
                                        </div>
                                        <span className="text-gray-800 dark:text-gray-200">{ex.name}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={onCustomExerciseClick} className="w-full text-sm p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2">
                                <Plus size={16}/> Add New Exercise to Library
                            </button>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
                    <button onClick={handleSaveActivity} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors w-full">
                        <Plus/> Save Activity
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddCustomExerciseModal = ({ onClose, onCustomExerciseSaved }) => {
    const [customExName, setCustomExName] = useState('');
    const [customExDetails, setCustomExDetails] = useState('');
    const [customExCategory, setCustomExCategory] = useState(exerciseCategories[0]);

    const handleSaveCustomExercise = () => {
        if (!customExName.trim() || !customExDetails.trim()) {
            // In a real app, show a user-friendly error message instead of an alert.
            console.error("All fields are required for custom exercise.");
            return;
        }
        onCustomExerciseSaved({ name: customExName, details: customExDetails, category: customExCategory });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Custom Exercise</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white"><X size={24}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <input type="text" value={customExName} onChange={e => setCustomExName(e.target.value)} placeholder="Custom Exercise Name"
                           className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"/>
                    <textarea value={customExDetails} onChange={e => setCustomExDetails(e.target.value)} placeholder="Exercise Details/Instructions"
                              className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 h-24 resize-none border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"></textarea>
                    <select value={customExCategory} onChange={e => setCustomExCategory(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                        {exerciseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
                    <button onClick={handleSaveCustomExercise} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors w-full">
                        <Plus/> Add to Exercise List
                    </button>
                </div>
            </div>
        </div>
    );
};


const MyActivitiesView = ({ customActivities, deleteActivity, onEditActivity, onAddActivity }) => (
    <div className="bg-white dark:bg-gray-800/50 p-4 sm:p-6 rounded-2xl shadow-lg border dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">My Activities</h3>
            <button onClick={onAddActivity} className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                <Plus size={20}/> <span className="hidden sm:inline">Create New</span>
            </button>
        </div>
        {customActivities.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-8">No activities created yet. Click 'Create New' to start!</p>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {customActivities.map(w => (
            <div key={w.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                        {React.createElement(activityIcons[w.icon] || Dumbbell, { className: "text-blue-500 flex-shrink-0" })}
                        <div className="flex-grow min-w-0">
                            <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{w.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{w.description}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => onEditActivity(w)} className="text-gray-400 dark:text-gray-500 hover:text-blue-500"><Edit size={20}/></button>
                        <button onClick={() => deleteActivity(w.id)} className="text-gray-400 dark:text-gray-500 hover:text-red-500"><Trash2 size={20}/></button>
                    </div>
                </div>
            </div>
        ))}
        </div>
    </div>
);

const HabitTrackerView = ({ habitList, setHabitList, db, auth }) => {
    const [weekStartDate, setWeekStartDate] = useState(getStartOfWeek(new Date()));
    const [week, setWeek] = useState([]);
    const [newHabitName, setNewHabitName] = useState('');
    const [habitProgress, setHabitProgress] = useState({});
    const [userId, setUserId] = useState(auth?.currentUser?.uid);

    useEffect(() => {
        if (!auth) return;
        const unsub = onAuthStateChanged(auth, user => setUserId(user?.uid));
        return unsub;
    }, [auth]);

    useEffect(() => {
        if (!userId || !db) return;
        const unsub = onSnapshot(doc(db, 'artifacts', appId, 'users', userId, 'progress', 'habits'), doc => {
            if (doc.exists()) setHabitProgress(doc.data().data || {});
        });
        return unsub;
    }, [userId, db]);

    const updateHabitProgress = useCallback(async (newProgress) => {
        if (!userId || !db) return;
        await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'progress', 'habits'), { data: newProgress });
    }, [userId, db]);

    useEffect(() => {
        const currentWeek = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStartDate);
            date.setDate(weekStartDate.getDate() + i);
            currentWeek.push(date);
        }
        setWeek(currentWeek);
    }, [weekStartDate]);

    const changeWeek = (amount) => setWeekStartDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + (amount * 7));
        return newDate;
    });

    const handleToggle = (date, habitId) => {
        const dateString = formatDate(date);
        const newProgress = { ...habitProgress };
        if (!newProgress[dateString]) newProgress[dateString] = {};
        newProgress[dateString][habitId] = !newProgress[dateString][habitId];
        setHabitProgress(newProgress);
        updateHabitProgress(newProgress);
    };
   
    const addHabit = () => {
        if (!newHabitName.trim()) return;
        const newHabit = { id: `custom-${Date.now()}`, name: newHabitName };
        setHabitList(prev => [...prev, newHabit]);
        setNewHabitName('');
    };

    const removeHabit = (habitId) => {
        setHabitList(prev => prev.filter(h => h.id !== habitId));
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 p-4 sm:p-6 rounded-2xl shadow-lg border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeWeek(-1)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronLeft className="text-gray-700 dark:text-gray-300"/></button>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-center">Week of {weekStartDate.toLocaleString('default', { month: 'short', day: 'numeric' })}</h3>
                <button onClick={() => changeWeek(1)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronRight className="text-gray-700 dark:text-gray-300"/></button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead>
                        <tr>
                            <th className="p-2 text-gray-500 dark:text-gray-400">Habit</th>
                            {week.map(day => (
                                <th key={day} className="p-2 text-center text-gray-500 dark:text-gray-400">
                                    <div>{day.toLocaleString('default', { weekday: 'short' })}</div>
                                    <div className="font-normal">{day.getDate()}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {habitList.map(habit => (
                            <tr key={habit.id} className="border-t border-gray-200 dark:border-gray-700">
                                <td className="p-3 font-medium text-gray-800 dark:text-gray-200 flex justify-between items-center">
                                    {habit.name}
                                    <button onClick={() => removeHabit(habit.id)} className="text-gray-400 dark:text-gray-500 hover:text-red-500 ml-2"><X size={16}/></button>
                                </td>
                                {week.map(day => {
                                    const isChecked = habitProgress[formatDate(day)]?.[habit.id] || false;
                                    return (
                                        <td key={`${habit.id}-${day}`} className="p-3 text-center">
                                            <button onClick={() => handleToggle(day, habit.id)} className="focus:outline-none">
                                                {isChecked ? <CheckCircle2 className="w-7 h-7 text-blue-500 mx-auto" /> : <Circle className="w-7 h-7 text-gray-300 dark:text-gray-600 mx-auto" />}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="Add a new habit..."
                       className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"/>
                <button onClick={addHabit} className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                    <Plus/> <span className="hidden sm:inline">Add Habit</span><span className="sm:hidden">Add</span>
                </button>
            </div>
        </div>
    );
};

const CustomDateRangeModal = ({ isOpen, onClose, onApply }) => {
    const [startDate, setStartDate] = useState(formatDate(new Date()));
    const [endDate, setEndDate] = useState(formatDate(new Date()));

    if (!isOpen) return null;

    const handleApply = () => {
        onApply(startDate, endDate);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-4 border dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Date Range</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold">Cancel</button>
                    <button onClick={handleApply} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">Apply</button>
                </div>
            </div>
        </div>
    );
};

const ActivityStats = ({ customActivities, calendarSchedule, activityProgress, activityLogs, theme }) => {
    const [statsRange, setStatsRange] = useState('week'); // 'week', 'month', 'custom'
    const [customRange, setCustomRange] = useState({ start: null, end: null });
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
   
    const timePeriodStats = useMemo(() => {
        const today = new Date();
        let startDate;
        let endDate = new Date();

        if (statsRange === 'week') {
            startDate = getStartOfWeek(today);
        } else if (statsRange === 'month') {
            startDate = getStartOfMonth(today);
        } else { // custom
            startDate = customRange.start ? new Date(customRange.start.replace(/-/g, '/')) : null;
            endDate = customRange.end ? new Date(customRange.end.replace(/-/g, '/')) : null;
        }
       
        if (!startDate || !endDate) {
             return { totalDuration: 0, totalDistance: 0, totalCalories: 0, completedCount: 0, pieData: [] };
        }
       
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);


        let totalDuration = 0;
        let totalDistance = 0;
        let totalCalories = 0;
        let completedCount = 0;
        const categoryCounts = {};
        activityCategories.forEach(cat => categoryCounts[cat] = 0);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = formatDate(d);
            const scheduledForDay = calendarSchedule[dateString] || [];

            scheduledForDay.forEach(instance => {
                const activity = customActivities.find(a => a.id === instance.activityId);
                if (!activity) return;

                let isCompleted = false;
                if (activity.exercises && activity.exercises.length > 0) {
                    const progress = activityProgress[dateString]?.[instance.instanceId] || {};
                    isCompleted = activity.exercises.every(ex => progress[ex.name]);
                } else {
                    isCompleted = activityLogs[dateString]?.some(log => log.instanceId === instance.instanceId);
                }

                if (isCompleted) {
                    completedCount++;
                    if (activity.category) {
                        categoryCounts[activity.category] = (categoryCounts[activity.category] || 0) + 1;
                    }

                    const log = activityLogs[dateString]?.find(l => l.instanceId === instance.instanceId);
                    if (log) {
                        if (log.duration) totalDuration += log.duration;
                        if (log.distance) totalDistance += log.distance;
                        if (log.calories) totalCalories += log.calories;
                    }
                }
            });
        }

        const pieData = Object.keys(categoryCounts)
            .filter(key => categoryCounts[key] > 0)
            .map(key => ({ name: key, value: categoryCounts[key] }));

        return { totalDuration, totalDistance, totalCalories, completedCount, pieData };
    }, [statsRange, customRange, calendarSchedule, activityProgress, activityLogs, customActivities]);

    const PIE_COLORS = {
        'Workout': '#3b82f6', // blue-500
        'Cardio': '#10b981', // emerald-500
        'Sport': '#f97316', // orange-500
    };

    const handleApplyCustomDate = (start, end) => {
        setCustomRange({ start, end });
        setStatsRange('custom');
    }

    return (
        <div className="bg-white dark:bg-gray-800/50 p-4 sm:p-6 rounded-2xl shadow-lg border dark:border-gray-700">
            <CustomDateRangeModal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} onApply={handleApplyCustomDate} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Activity Stats</h3>
                <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
                    <button onClick={() => setStatsRange('week')} className={`px-3 py-1 text-sm rounded-full ${statsRange === 'week' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Week</button>
                    <button onClick={() => setStatsRange('month')} className={`px-3 py-1 text-sm rounded-full ${statsRange === 'month' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Month</button>
                    <button onClick={() => setIsDateModalOpen(true)} className={`px-3 py-1 text-sm rounded-full ${statsRange === 'custom' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Custom</button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
                 <div className="h-48 md:h-56 w-full md:w-1/3 relative">
                    {timePeriodStats.pieData.length > 0 ? (
                        <>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">{timePeriodStats.completedCount}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Complete</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={timePeriodStats.pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="70%"
                                        outerRadius="100%"
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                        paddingAngle={5}
                                    >
                                        {timePeriodStats.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#8884d8'} className="focus:outline-none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{
                                            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                                            borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
                                            borderRadius: '0.5rem'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            No completed activities in this period.
                        </div>
                    )}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-4 text-center w-full">
                    <div>
                        <p className="text-2xl md:text-3xl font-bold text-blue-500">{timePeriodStats.totalDuration}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Mins</p>
                    </div>
                    <div>
                        <p className="text-2xl md:text-3xl font-bold text-blue-500">{timePeriodStats.totalDistance.toFixed(1)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Distance (km)</p>
                    </div>
                    <div>
                        <p className="text-2xl md:text-3xl font-bold text-blue-500">{timePeriodStats.totalCalories}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Calories</p>
                    </div>
                </div>
            </div>
        </div>
    );
  };


const DashboardView = ({ customActivities, calendarSchedule, activityProgress, activityLogs, theme, setAssigningToDate, startActivity, quickCompleteActivity }) => {
    const today = new Date();
    const formattedDate = formatDateWithOrdinal(today);
    const startOfWeek = getStartOfWeek(today);
    let scheduledThisWeek = 0;
    let completedThisWeek = 0;

    for(let i=0; i<7; i++){
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateString = formatDate(date);
        const schedule = calendarSchedule[dateString] || [];
        scheduledThisWeek += schedule.length;

        if (schedule.length > 0) {
            schedule.forEach(instance => {
                const activity = customActivities.find(w => w.id === instance.activityId);
                if (activity) {
                    let isCompleted = false;
                    if (activity.exercises && activity.exercises.length > 0) {
                        const progress = activityProgress[dateString]?.[instance.instanceId] || {};
                        isCompleted = activity.exercises.every(ex => progress[ex.name]);
                    } else {
                        isCompleted = activityLogs[dateString]?.some(l => l.instanceId === instance.instanceId);
                    }
                    if (isCompleted) {
                        completedThisWeek++;
                    }
                }
            });
        }
    }
   
    const completionPercentage = scheduledThisWeek > 0 ? (completedThisWeek / scheduledThisWeek) * 100 : 0;
    let medal = null;
    if (completionPercentage >= 100) medal = { color: 'text-yellow-400', name: 'Gold' };
    else if (completionPercentage >= 70) medal = { color: 'text-gray-400', name: 'Silver' };
    else if (completionPercentage >= 50) medal = { color: 'text-yellow-600', name: 'Bronze' };

    const [streak, setStreak] = useState(0);
    useEffect(() => {
        let currentStreak = 0;
        const d = new Date();
        d.setHours(0,0,0,0);

        // Check from today backwards
        while(true) {
            const dateStr = formatDate(d);
            const schedule = calendarSchedule[dateStr] || [];
           
            if (schedule.length > 0) {
                 const allCompleted = schedule.every(instance => {
                    const activity = customActivities.find(w => w.id === instance.activityId);
                    if (!activity) return false;
                     let isInstanceCompleted = false;
                     if (activity.exercises && activity.exercises.length > 0) {
                         const progress = activityProgress[dateStr]?.[instance.instanceId] || {};
                         isInstanceCompleted = activity.exercises.every(ex => progress[ex.name]);
                     } else {
                         isInstanceCompleted = activityLogs[dateStr]?.some(log => log.instanceId === instance.instanceId);
                     }
                    return isInstanceCompleted;
                });

                if (allCompleted) {
                    currentStreak++;
                } else {
                    const isToday = formatDate(new Date()) === dateStr;
                    if(!isToday) break;
                }
            } else {
                const isToday = formatDate(new Date()) === dateStr;
                if(!isToday && currentStreak > 0) break;
            }
           
            if (currentStreak === 0 && formatDate(new Date()) !== dateStr) {
                const todayD = new Date();
                todayD.setHours(0,0,0,0);
                if (d.getTime() < todayD.getTime()) break;
            }

            d.setDate(d.getDate() - 1);
            if (currentStreak > 365) break; 
        }
        setStreak(currentStreak);
    }, [calendarSchedule, activityProgress, activityLogs, customActivities]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Today's Focus</h3>
                            <p className="font-semibold text-gray-500 dark:text-gray-400">{formattedDate}</p>
                        </div>
                        <button onClick={() => setAssigningToDate(formatDate(new Date()))} className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"><PlusCircle size={24}/></button>
                    </div>
                    {calendarSchedule[formatDate(new Date())]?.length > 0 ? (
                        calendarSchedule[formatDate(new Date())].map(s => {
                            const activity = customActivities.find(a => a.id === s.activityId);
                            if (!activity) return null;
                            const Icon = activity?.icon ? activityIcons[activity.icon] : Dumbbell;
                            const progress = activityProgress[formatDate(new Date())]?.[s.instanceId] || {};
                            let isComplete = false;
                            if (activity?.exercises && activity.exercises.length > 0) {
                                isComplete = activity.exercises.every(ex => progress[ex.name]);
                            } else {
                                isComplete = activityLogs[formatDate(new Date())]?.some(log => log.instanceId === s.instanceId);
                            }
                           
                            return (
                                <div key={s.instanceId} className={`p-4 rounded-lg mb-2 flex items-center justify-between transition-colors ${isComplete ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <div onClick={() => startActivity(formatDate(new Date()), s)} className="cursor-pointer flex-grow flex items-center gap-3">
                                        <Icon className="text-blue-500 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-100">{activity?.name || '...'}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{activity?.exercises && activity.exercises.length > 0 ? `${activity.exercises.length} exercises` : activity?.category}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => quickCompleteActivity(formatDate(new Date()), s.instanceId, activity)} className="p-2 text-gray-500 hover:text-blue-500">
                                        {isComplete ? <CheckCircle2/> : <Circle/>}
                                    </button>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No activities scheduled for today. Add one from the calendar!</p>
                    )}
                </div>
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border dark:border-gray-700 flex flex-col items-center justify-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Activity Streak</h3>
                        <div className="flex items-center gap-2">
                            <Flame className="text-orange-500" size={32}/>
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">{streak}</span>
                            <span className="text-gray-500 dark:text-gray-400">days</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border dark:border-gray-700 flex flex-col items-center justify-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Weekly Goal</h3>
                        <div className="flex items-center gap-2">
                            {medal ? <Award size={32} className={medal.color}/> : <Award size={32} className="text-gray-300 dark:text-gray-600"/>}
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedThisWeek} / {scheduledThisWeek}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             <ActivityStats 
                customActivities={customActivities}
                calendarSchedule={calendarSchedule}
                activityProgress={activityProgress}
                activityLogs={activityLogs}
                theme={theme}
             />
        </div>
    );
  };

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activityChecklist, setActivityChecklist] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [editingActivity, setEditingActivity] = useState(null);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [assigningToDate, setAssigningToDate] = useState(null);
 
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [calendarView, setCalendarView] = useState(isMobile ? 'week' : 'month');
 
  const [activityProgress, setActivityProgress] = useState({});
  const [customActivities, setCustomActivities] = useState([]);
  const [calendarSchedule, setCalendarSchedule] = useState({});
  const [userExercises, setUserExercises] = useState([]);
  const [habitList, setHabitList] = useState(defaultHabits);
  const [activityLogs, setActivityLogs] = useState({});
 
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [configError, setConfigError] = useState(null);

  const allExercises = [...masterExerciseList, ...userExercises];
 
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    setCalendarView(isMobile ? 'week' : 'month');
  }, [isMobile]);

  useEffect(() => {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
        setConfigError("Firebase configuration is missing. Please add your credentials to the firebaseConfig object in App.jsx.");
        return;
    }
    try {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        setDb(getFirestore(app));
        setAuth(authInstance);

        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    await signInAnonymously(authInstance);
                } catch (error) { console.error("Authentication Error:", error); }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    } catch (e) {
        console.error("Error initializing Firebase:", e);
        setConfigError("Failed to initialize Firebase. Check your configuration.");
    }
  }, []);

  const useDataUpdater = (data, docName) => {
      const updateInFirestore = useCallback(async () => {
          if (!isAuthReady || !userId || !db) return;
          try {
              const docRef = doc(db, 'artifacts', appId, 'users', userId, 'data', docName);
              await setDoc(docRef, { data });
          } catch (error) { console.error(`Error saving ${docName}:`, error); }
      }, [userId, data, isAuthReady, docName, db]);

      useEffect(() => {
          const handler = setTimeout(() => { updateInFirestore(); }, 1000);
          return () => clearTimeout(handler);
      }, [data, updateInFirestore]);
  };

  useDataUpdater(activityProgress, 'activityCompletion');
  useDataUpdater(calendarSchedule, 'calendarSchedule');
  useDataUpdater(habitList, 'habitList');
  useDataUpdater(userExercises, 'userExercises');
  useDataUpdater(activityLogs, 'activityLogs');
 
  useEffect(() => {
    if (!isAuthReady || !userId || !db) return;
    const unsubActivityProgress = onSnapshot(doc(db, 'artifacts', appId, 'users', userId, 'data', 'activityCompletion'), doc => { if(doc.exists()) setActivityProgress(doc.data().data || {})});
    const unsubSchedule = onSnapshot(doc(db, 'artifacts', appId, 'users', userId, 'data', 'calendarSchedule'), doc => { if(doc.exists()) setCalendarSchedule(doc.data().data || {})});
    const unsubHabits = onSnapshot(doc(db, 'artifacts', appId, 'users', userId, 'data', 'habitList'), doc => { if(doc.exists()) setHabitList(doc.data().data || defaultHabits)});
    const unsubUserEx = onSnapshot(doc(db, 'artifacts', appId, 'users', userId, 'data', 'userExercises'), doc => { if(doc.exists()) setUserExercises(doc.data().data || [])});
    const unsubActivityLogs = onSnapshot(doc(db, 'artifacts', appId, 'users', userId, 'data', 'activityLogs'), doc => { if(doc.exists()) setActivityLogs(doc.data().data || {})});
   
    const activitiesCol = collection(db, 'artifacts', appId, 'users', userId, 'customActivities');
    const unsubActivities = onSnapshot(query(activitiesCol), snapshot => {
        const activitiesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (activitiesList.length === 0 && !snapshot.metadata.hasPendingWrites && customActivities.length === 0) {
           exampleActivities.forEach(w => saveNewActivity(w));
        }
        setCustomActivities(activitiesList);
    });

    return () => { unsubActivityProgress(); unsubSchedule(); unsubHabits(); unsubUserEx(); unsubActivities(); unsubActivityLogs(); };
  }, [isAuthReady, userId, db]);

  const saveNewActivity = async (activityData, idToUpdate = null) => {
      if (!isAuthReady || !userId || !db) return;
      try {
          if (idToUpdate) {
              const activityDoc = doc(db, 'artifacts', appId, 'users', userId, 'customActivities', idToUpdate);
              await updateDoc(activityDoc, activityData);
          } else {
              const activitiesCol = collection(db, 'artifacts', appId, 'users', userId, 'customActivities');
              await addDoc(activitiesCol, activityData);
          }
      } catch (e) { console.error("Error saving activity: ", e); }
  };

  const deleteActivityFromSchedule = (date, instanceId) => {
        setCalendarSchedule(prev => {
            const daySchedule = (prev[date] || []).filter(s => s.instanceId !== instanceId);
            if (daySchedule.length === 0) {
                const newSchedule = {...prev};
                delete newSchedule[date];
                return newSchedule;
            }
            return { ...prev, [date]: daySchedule };
        });
  };

  const deleteActivity = async (activityId) => {
      setConfirmingDelete(null);
      if (!isAuthReady || !userId || !db) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'customActivities', activityId));
          const newSchedule = { ...calendarSchedule };
          Object.keys(newSchedule).forEach(date => {
              newSchedule[date] = newSchedule[date].filter(s => s.activityId !== activityId);
              if (newSchedule[date].length === 0) delete newSchedule[date];
          });
          setCalendarSchedule(newSchedule);
      } catch (e) { console.error("Error deleting activity: ", e); }
  };
 
  const confirmAndDeleteActivity = (activityId) => {
      setConfirmAction(() => () => deleteActivity(activityId));
      setConfirmingDelete("This will permanently delete the activity and remove it from your calendar.");
  };

  const saveCustomExercise = (exerciseData) => {
      const newExercise = { ...exerciseData, id: `user-${Date.now()}` };
      setUserExercises(prev => [...prev, newExercise]);
  };

  const startActivity = (date, instance) => {
    setActivityChecklist({ date, ...instance });
  };
 
  const handleActivityComplete = (activity, day) => {
      setActivityChecklist(null);
  };
 
  const quickCompleteActivity = (date, instanceId, activity) => {
    if (activity.exercises && activity.exercises.length > 0) {
        const newProgress = JSON.parse(JSON.stringify(activityProgress));
        if (!newProgress[date]) newProgress[date] = {};
       
        const isAlreadyComplete = activity.exercises.every(ex => newProgress[date]?.[instanceId]?.[ex.name]);

        const newInstanceState = {};
        activity.exercises.forEach(ex => {
        newInstanceState[ex.name] = !isAlreadyComplete;
        });
        newProgress[date][instanceId] = newInstanceState;
        setActivityProgress(newProgress);
       
        // Also update the log for stats
        setActivityLogs(prev => {
           const dayLogs = prev[date] || [];
           if (isAlreadyComplete) { // if unchecking, remove log
               const filteredLogs = dayLogs.filter(log => log.instanceId !== instanceId);
               if (filteredLogs.length === 0) {
                   const newLogs = {...prev};
                   delete newLogs[date];
                   return newLogs;
               }
               return { ...prev, [date]: filteredLogs };
           } else { // if checking, add a default log (user can edit duration in modal)
               const newLog = { instanceId, activityId: activity.id, duration: 0, distance: 0, calories: 0 };
               const filteredLogs = dayLogs.filter(log => log.instanceId !== instanceId);
               return { ...prev, [date]: [...filteredLogs, newLog] };
           }
        });

    } else {
        const isAlreadyComplete = activityLogs[date]?.some(log => log.instanceId === instanceId);
        if (isAlreadyComplete) {
            setActivityLogs(prev => {
                const dayLogs = prev[date]?.filter(log => log.instanceId !== instanceId) || [];
                if (dayLogs.length === 0) {
                    const newLogs = {...prev};
                    delete newLogs[date];
                    return newLogs;
                }
                return { ...prev, [date]: dayLogs };
            });
        } else {
            setActivityLogs(prev => {
                const dayLogs = prev[date] || [];
                const newLog = { 
                    instanceId: instanceId,
                    activityId: activity.id,
                    duration: null,
                    distance: null,
                };
                return { ...prev, [date]: [...dayLogs, newLog] };
            });
        }
    }
  };

  if (configError) {
    return (
        <div className="bg-red-100 text-red-800 p-8 min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Configuration Error</h1>
                <p>{configError}</p>
            </div>
        </div>
    )
  }

  if (!isAuthReady || !db) {
    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen flex items-center justify-center">
            <p>Loading...</p>
        </div>
    )
  }

  const tabs = [
    { name: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { name: 'calendar', label: 'Calendar', icon: Calendar },
    { name: 'myActivities', label: 'Activities', icon: Dumbbell },
    { name: 'habits', label: 'Habits', icon: ListChecks },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen font-sans">
      <div className={`max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 ${isMobile ? 'pb-24 pt-20' : ''}`}>
       
        <header className={`flex justify-between items-center ${isMobile ? 'fixed top-0 left-0 right-0 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 border-b dark:border-gray-800 z-40' : 'mb-8'}`}>
            {isMobile ? (
                <>
                    <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <User/>
                    </button>
                     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        {theme === 'light' ? <Moon/> : <Sun/>}
                    </button>
                </>
            ) : (
                <>
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                        {tabs.map(tab => (
                            <button key={tab.name} onClick={() => setActiveTab(tab.name)}
                                    className={`flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base ${activeTab === tab.name ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                <tab.icon size={20}/>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            {theme === 'light' ? <Moon/> : <Sun/>}
                        </button>
                        <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <User/>
                        </button>
                    </div>
                </>
            )}
        </header>

        <main>
            {activeTab === 'dashboard' && <DashboardView 
                customActivities={customActivities}
                calendarSchedule={calendarSchedule}
                activityProgress={activityProgress}
                activityLogs={activityLogs}
                theme={theme}
                setAssigningToDate={setAssigningToDate}
                startActivity={startActivity}
                quickCompleteActivity={quickCompleteActivity}
            />}
            {activeTab === 'calendar' && <CalendarView activityProgress={activityProgress} customActivities={customActivities} calendarSchedule={calendarSchedule} setCalendarSchedule={setCalendarSchedule} onStartActivity={startActivity} onConfirmDelete={(action) => { setConfirmAction(() => action); setConfirmingDelete("Are you sure you want to remove this activity from the calendar?"); }} quickComplete={quickCompleteActivity} view={calendarView} setView={setCalendarView} activityLogs={activityLogs} />}
            {activeTab === 'myActivities' && <MyActivitiesView customActivities={customActivities} deleteActivity={confirmAndDeleteActivity} onEditActivity={(activity) => setEditingActivity(activity)} onAddActivity={() => setEditingActivity({})} />}
            {activeTab === 'habits' && <HabitTrackerView habitList={habitList} setHabitList={setHabitList} db={db} auth={auth} />}
        </main>
      </div>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-around items-center shadow-t-2xl">
            {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                    <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`flex flex-col items-center justify-center w-full h-full text-xs transition-colors ${activeTab === tab.name ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Icon size={24} />
                        <span className="mt-1">{tab.label}</span>
                    </button>
                )
            })}
        </nav>
      )}

      {assigningToDate && <AssignActivityModal date={assigningToDate} onClose={() => setAssigningToDate(null)} customActivities={customActivities} setCalendarSchedule={setCalendarSchedule} />}

      {activityChecklist && (
        <ActivityChecklistModal
          day={activityChecklist}
          onClose={() => setActivityChecklist(null)}
          activityProgress={activityProgress}
          setActivityProgress={setActivityProgress}
          customActivities={customActivities}
          activityLogs={activityLogs}
          setActivityLogs={setActivityLogs}
          onConfirmDelete={(callback) => { 
              setConfirmAction(() => () => {
                  deleteActivityFromSchedule(activityChecklist.date, activityChecklist.instanceId);
                  callback();
              }); 
              setConfirmingDelete("Are you sure you want to remove this activity from the calendar?"); 
          }}
        />
      )}
      {editingActivity && <CreateOrEditActivityModal onClose={() => setEditingActivity(null)} onActivitySaved={saveNewActivity} allExercises={allExercises} activityToEdit={editingActivity.id ? editingActivity : null} onCustomExerciseClick={() => setIsAddingExercise(true)} />}
      {isAddingExercise && <AddCustomExerciseModal onClose={() => setIsAddingExercise(false)} onCustomExerciseSaved={saveCustomExercise} />}
      {confirmingDelete && (
        <ConfirmationModal
            message={confirmingDelete}
            onConfirm={() => { if(confirmAction) confirmAction(); setConfirmingDelete(null); setConfirmAction(null); }}
            onCancel={() => { setConfirmingDelete(null); setConfirmAction(null); }}
        />
      )}
    </div>
  );
}
