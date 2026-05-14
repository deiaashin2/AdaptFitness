import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Calculator,
    Book,
    ScanBarcode,
    Dumbbell,
    Target,
    TrendingUp,
    Flame,
    Activity,
    ChevronRight,
    LogOut,
    Settings,
    Bell,
    UtensilsCrossed,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';

// Types
interface Profile {
    id: string;
    email: string;
    name: string | null;
    avatar_url?: string;
}

interface UserMetrics {
    user_id: string;
    age: number;
    gender: string;
    weight: number;
    height: number;
    goal_weight?: number;
    activity_level: string;
    unit_system: string;
    created_at: string;
}

interface MetabolicCalculation {
    user_id: string;
    goal: string;
    bmr: number;
    rmr: number;
    tdee: number;
    calorie_goal: number;
    protein_grams: number;
    carbs_grams: number;
    fat_grams: number;
    created_at: string;
}

interface ExerciseLog {
    id: string;
    user_id: string;
    exercise_type: string;
    sets: number;
    reps: number;
    weight?: number;
    duration_minutes: number;
    exercise_date: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [loading, setLoading] = useState(true);
    const kgToLbs = (kg: number) => Math.round(kg * 2.205 * 10) / 10;
    
    // User profile data
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
    const [latestCalculation, setLatestCalculation] = useState<MetabolicCalculation | null>(null);
    const [weeklyExercises, setWeeklyExercises] = useState<ExerciseLog[]>([]);
    const [todaysMeals, setTodaysMeals] = useState<any[]>([]);
    const [weeklyMeals, setWeeklyMeals] = useState<any[]>([]);
    const [monthlyMeals, setMonthlyMeals] = useState<any[]>([]);
    const [waterIntake, setWaterIntake] = useState(0);

    // Fetch user data on mount
    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    const fetchUserData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profileError && profileData) {
                setProfile(profileData);
            }

            // Fetch latest user metrics
            const { data: metricsData, error: metricsError } = await supabase
                .from('user_metrics')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!metricsError && metricsData) {
                setUserMetrics(metricsData);
            }

            // Fetch latest calculation
            const { data: calculationData, error: calcError } = await supabase
                .from('metabolic_calculations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!calcError && calculationData) {
                setLatestCalculation(calculationData);
            }

            // Fetch this week's exercises
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date();
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const { data: exercisesData, error: exercisesError } = await supabase
                .from('exercise_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('exercise_date', weekStart.toISOString())
                .order('exercise_date', { ascending: true });

            if (!exercisesError && exercisesData) {
                setWeeklyExercises(exercisesData);
            }

            // Fetch today's meal logs
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const { data: mealsData, error: mealsError } = await supabase
                .from('meal_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('meal_date', todayStart.toISOString())
                .lte('meal_date', todayEnd.toISOString());

            if (!mealsError && mealsData) {
                setTodaysMeals(mealsData);
            }

            // Fetch this week's meal logs
            const { data: weekMealsData, error: weekMealsError } = await supabase
                .from('meal_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('meal_date', weekStart.toISOString())
                .lte('meal_date', weekEnd.toISOString());

            if (!weekMealsError && weekMealsData) {
                setWeeklyMeals(weekMealsData);
            }

            // Fetch this month's meal logs
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const { data: monthMealsData } = await supabase
                .from('meal_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('meal_date', monthStart.toISOString());

            if (monthMealsData) setMonthlyMeals(monthMealsData);

            // Fetch today's water logs
            const { data: waterData } = await supabase
                .from('water_logs')
                .select('cups')
                .eq('user_id', user.id)
                .gte('logged_at', todayStart.toISOString());

            if (waterData) {
                const total = waterData.reduce((sum, log) => sum + (log.cups || 0), 0);
                setWaterIntake(total);
            }


        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRecommendedCalories = () => {
        if (!latestCalculation) return 2200;
        
        switch (latestCalculation.goal) {
          case 'lose':
            return latestCalculation.calorie_goal; // weight loss calories
          case 'gain':
            return latestCalculation.calorie_goal; // weight gain calories
          case 'maintain':
          default:
            return latestCalculation.tdee; // maintenance calories
        }
      };

    // Sum calories from today's logged meals
    const todayCaloriesConsumed = todaysMeals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) ?? 0;

    // Workout goal of the week
    const getWorkoutGoal = () => {
        switch (userMetrics?.activity_level) {
          case 'sedentary': return 2;
          case 'lightly_active': return 3;
          case 'moderately_active': return 4;
          case 'very_active': return 5;
          default: return 3;
        }
      };

    // Calculate stats from real data
    const stats = {
        caloriesConsumed: todayCaloriesConsumed,
        caloriesGoal: getRecommendedCalories(),
        caloriesPercentage: Math.round((todayCaloriesConsumed / getRecommendedCalories()) * 100),
        workoutsThisWeek: weeklyExercises.length,
        workoutsGoal: getWorkoutGoal(),
        currentWeight: userMetrics?.weight ? kgToLbs(userMetrics.weight) : 0,
        goalWeight: userMetrics?.goal_weight ? kgToLbs(userMetrics.goal_weight) : 0,        waterIntake: waterIntake,
        waterGoal: 8,
    };

    // Calorie intake data
    const CalorieData = (() => {
        if (selectedPeriod === 'week') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const caloriesByDay = Array(7).fill(0);
            weeklyMeals.forEach(meal => {
                const dayIndex = new Date(meal.meal_date).getDay();
                caloriesByDay[dayIndex] += meal.calories || 0;
            });
            return days.map((day, i) => ({
                day,
                calories: caloriesByDay[i],
                goal: getRecommendedCalories(),
            }));
        } else {
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const caloriesByDate = Array(daysInMonth).fill(0);
            monthlyMeals.forEach(meal => {
                const date = new Date(meal.meal_date).getDate() - 1;
                caloriesByDate[date] += meal.calories || 0;
            });
            return caloriesByDate.map((calories, i) => ({
                day: `${i + 1}`,
                calories,
                goal: getRecommendedCalories(),
            }));
        }
    })();

    const handleAddWater = async () => {
        if (!user) return;
        const { error } = await supabase
            .from('water_logs')
            .insert({ user_id: user.id, cups: 1 });
        
        if (!error) setWaterIntake(prev => prev + 1);
    };

    // Weekly workout data
    const weeklyWorkoutData = (() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const workoutsByDay = Array(7).fill(0);

        weeklyExercises.forEach(exercise => {
            const day = new Date(exercise.exercise_date).getDay();
            workoutsByDay[day] += exercise.duration_minutes || 30;
        });

        return days.map((day, index) => ({
            day,
            duration: workoutsByDay[index],
        }));
    })();

    // Calculate macros from latest calculation
    const macrosData = latestCalculation ? [
        { 
            name: 'Protein', 
            value: todaysMeals.reduce((sum, meal) => sum + (meal.protein_grams || 0), 0),
            color: '#8b5cf6' 
        },
        { 
            name: 'Carbs', 
            value: todaysMeals.reduce((sum, meal) => sum + (meal.carbs_grams || 0), 0),
            color: '#3b82f6' 
        },
        { 
            name: 'Fats', 
            value: todaysMeals.reduce((sum, meal) => sum + (meal.fat_grams || 0), 0),
            color: '#10b981' 
        },
    ] : [
        { name: 'Protein', value: 150, color: '#8b5cf6' },
        { name: 'Carbs', value: 200, color: '#3b82f6' },
        { name: 'Fats', value: 65, color: '#10b981' },
    ];

    const todaysMealsActivity = todaysMeals.slice(0, 3).map(meal => ({
        type: 'meal',
        name: meal.meal_name,
        detail: `${meal.calories} cal · ${meal.meal_type}`,
        time: new Date(meal.meal_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        icon: UtensilsCrossed,
    }));

    const todaysExercisesActivity = weeklyExercises
    .filter(ex => {
        const exDate = new Date(ex.exercise_date);
        const today = new Date();
        return exDate.toDateString() === today.toDateString();
    })
    .slice(0, 3)
    .map(exercise => ({
        type: 'workout',
        name: exercise.exercise_type || 'Workout',
        detail: `${exercise.sets} sets · ${exercise.reps} reps${exercise.weight ? ` · ${exercise.weight} lbs` : ''}`,
        time: new Date(exercise.exercise_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        icon: Dumbbell,
    }));

    // Recent activity from exercises
    const recentActivity = [...todaysMealsActivity, ...todaysExercisesActivity];

    const features = [
        {
            icon: Calculator,
            title: 'Calorie Calculator',
            description: 'Calculate your daily calorie needs based on BMI and goals',
            color: 'bg-blue-500',
            href: '/calculator',
        },
        {
            icon: Book,
            title: 'Nutrition Log',
            description: 'Track your daily meals and nutritional intake',
            color: 'bg-green-500',
            href: '/nutrition-log',
        },
        {
            icon: ScanBarcode,
            title: 'Barcode Scanner',
            description: 'Quickly scan and log food items',
            color: 'bg-purple-500',
            href: '/scanner',
            comingSoon: true,
        },
        {
            icon: Dumbbell,
            title: 'Fitness Log',
            description: 'Record your workouts and track progress',
            color: 'bg-orange-500',
            href: '/fitness-log',
        },
        {
            icon: Target,
            title: 'Workout Plans',
            description: 'Get personalized workout recommendations',
            color: 'bg-pink-500',
            href: '/workouts',
            comingSoon: true,
        },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Get user initials
    const getUserInitials = () => {
        if (profile?.name) {
            return profile.name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase();
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Get display name  
    const getDisplayName = () => {
        return profile?.name || user?.email?.split('@')[0] || 'User';
    };

    // Add loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg">
                                <Flame className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">FitTrack Pro</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon">
                                <Bell className="h-5 w-5" />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Settings className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="icon" onClick={handleLogout}>
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {getDisplayName().split(' ')[0]}! 👋
                    </h2>
                    <p className="text-gray-600">Here's your fitness overview for today</p>
                </div>

                {/* Show prompt if no data yet */}
                {!latestCalculation && (
                    <Card className="mb-8 bg-blue-50 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <Calculator className="h-8 w-8 text-blue-600 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                        Get Started with Your Fitness Journey!
                                    </h3>
                                    <p className="text-blue-700 mb-4">
                                        Complete your calorie calculator to see personalized insights and track your progress.
                                    </p>
                                    <Button 
                                        onClick={() => navigate('/calculator')}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Calculate My Calories
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Calories Today</CardTitle>
                            <Flame className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {stats.caloriesConsumed} / {stats.caloriesGoal}
                            </div>
                            <Progress value={stats.caloriesPercentage} className="mt-2" />
                            <p className="text-xs text-gray-500 mt-2">{stats.caloriesPercentage}% of daily goal</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Workouts This Week</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {stats.workoutsThisWeek} / {stats.workoutsGoal}
                            </div>
                            <Progress value={(stats.workoutsThisWeek / stats.workoutsGoal) * 100} className="mt-2" />
                            <p className="text-xs text-gray-500 mt-2">
                              {stats.workoutsThisWeek >= stats.workoutsGoal
                                ? 'Goal reached this week!'
                                : `${stats.workoutsGoal - stats.workoutsThisWeek} more to reach your goal!`}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Current Weight</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{stats.currentWeight} lbs</div>
                            <Progress
                                value={(() => {
                                    if (!stats.goalWeight || !stats.currentWeight) return 0;
                                    if (latestCalculation?.goal === 'gain') {
                                        return Math.min(Math.max((stats.currentWeight / stats.goalWeight) * 100, 0), 100);
                                    } else {
                                        return Math.min(Math.max(((stats.currentWeight - stats.goalWeight) / (stats.currentWeight - stats.goalWeight + 10)) * 100, 0), 100);
                                    }
                                })()}
                                className="mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              {Math.abs(stats.goalWeight - stats.currentWeight).toFixed(2)} lbs to goal
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Water Intake</CardTitle>
                            <div className="h-4 w-4 text-blue-400">💧</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {stats.waterIntake} / {stats.waterGoal} cups
                            </div>
                            <Progress value={(stats.waterIntake / stats.waterGoal) * 100} className="mt-2" />
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-500">
                                    {stats.waterIntake >= stats.waterGoal
                                        ? 'Goal reached!'
                                        : `${stats.waterGoal - stats.waterIntake} cups remaining`}
                                </p>
                                <Button size="sm" variant="outline" onClick={handleAddWater} className="text-xs h-7">
                                    + Add Cup
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Charts Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Calorie Tracking Chart */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Calorie Tracking</CardTitle>
                                        <CardDescription>Your daily calorie intake vs. goal</CardDescription>
                                    </div>
                                    <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                        <TabsList>
                                            <TabsTrigger value="week">Week</TabsTrigger>
                                            <TabsTrigger value="month">Month</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={CalorieData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="goal"
                                            stroke="#d1d5db"
                                            fill="#f3f4f6"
                                            strokeDasharray="5 5"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="calories"
                                            stroke="#3b82f6"
                                            fill="#93c5fd"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Workout Duration Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Workout Duration</CardTitle>
                                <CardDescription>Minutes per workout session this week</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={weeklyWorkoutData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="duration" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Macros Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Today's Macros</CardTitle>
                                <CardDescription>Protein, carbs, and fats breakdown</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={macrosData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {macrosData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 mt-4">
                                    {macrosData.map((macro) => (
                                        <div key={macro.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: macro.color }}
                                                />
                                                <span className="text-sm text-gray-600">{macro.name}</span>
                                            </div>
                                            <span className="text-sm font-medium">{macro.value}g</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Your latest meals and workouts from today</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => {
                                        const Icon = activity.icon;
                                        return (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${activity.type === 'meal' ? 'bg-green-100' : 'bg-blue-100'}`}>
                                                    <Icon className={`h-4 w-4 ${activity.type === 'meal' ? 'text-green-600' : 'text-blue-600'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {activity.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {activity.detail} • {activity.time}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <Card
                                    key={index}
                                    className={`transition-shadow ${feature.comingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
                                    onClick={() => !feature.comingSoon && navigate(feature.href)}
                                >
                                    <CardContent className="p-6">
                                        <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                                        <p className="text-sm text-gray-600 line-clamp-2">{feature.description}</p>
                                        <div className="flex items-center justify-between mt-3">
                                            {feature.comingSoon
                                                ? <Badge variant="secondary">Coming Soon</Badge>
                                                : <ChevronRight className="h-4 w-4 text-gray-400" />
                                            }
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Today's Goals */}
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Goals</CardTitle>
                        <CardDescription>Track your daily objectives</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Workout Goal */}
                            {(() => {
                                const todaysWorkouts = weeklyExercises.filter(ex =>
                                    new Date(ex.exercise_date).toDateString() === new Date().toDateString()
                                ).length;
                                const workoutGoal = 1;
                                const done = todaysWorkouts >= workoutGoal;
                                return (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Complete 1 Workout</span>
                                            {done
                                                ? <Badge className="bg-green-500">Completed</Badge>
                                                : <Badge variant="secondary">{todaysWorkouts}/{workoutGoal}</Badge>
                                            }
                                        </div>
                                        <Progress value={Math.min((todaysWorkouts / workoutGoal) * 100, 100)} />
                                    </div>
                                );
                            })()}
                            {/* Meals Goal */}
                            {(() => {
                                const mealGoal = 3;
                                const done = todaysMeals.length >= mealGoal;
                                return (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Log {mealGoal} Meals</span>
                                            {done
                                                ? <Badge className="bg-green-500">Completed</Badge>
                                                : <Badge variant="secondary">{todaysMeals.length}/{mealGoal}</Badge>
                                            }
                                        </div>
                                        <Progress value={Math.min((todaysMeals.length / mealGoal) * 100, 100)} />
                                    </div>
                                );
                            })()}
                            {/* Water Goal */}
                            {(() => {
                                const done = waterIntake >= stats.waterGoal;
                                return (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Drink {stats.waterGoal} Cups of Water</span>
                                            {done
                                                ? <Badge className="bg-green-500">Completed</Badge>
                                                : <Badge variant="secondary">{waterIntake}/{stats.waterGoal}</Badge>
                                            }
                                        </div>
                                        <Progress value={Math.min((waterIntake / stats.waterGoal) * 100, 100)} />
                                    </div>
                                );
                            })()}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}