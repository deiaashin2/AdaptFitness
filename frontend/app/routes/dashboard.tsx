import { useState } from 'react';
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
    Apple,
    // Clock,
    // Calendar,
    ChevronRight,
    LogOut,
    Settings,
    Bell,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user: currentUser, logout } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState('week');

    const userName =
        currentUser?.user_metadata?.name ||
        (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
    const userEmail = currentUser?.email || 'Unknown';
    const userAvatar = currentUser?.user_metadata?.avatar || '';
    const userInitials = userName
        .split(' ')
        .filter(Boolean)
        .map((part: any) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const user = {
        name: userName,
        email: userEmail,
        avatar: userAvatar,
        initials: userInitials,
    };

    // Mock stats data
    const stats = {
        caloriesConsumed: 1850,
        caloriesGoal: 2200,
        caloriesPercentage: 84,
        workoutsThisWeek: 4,
        workoutsGoal: 5,
        currentWeight: 165,
        goalWeight: 155,
        waterIntake: 6,
        waterGoal: 8,
    };

    // Mock weekly calorie data
    const weeklyCalorieData = [
        { day: 'Mon', calories: 2100, goal: 2200 },
        { day: 'Tue', calories: 1950, goal: 2200 },
        { day: 'Wed', calories: 2300, goal: 2200 },
        { day: 'Thu', calories: 1850, goal: 2200 },
        { day: 'Fri', calories: 2150, goal: 2200 },
        { day: 'Sat', calories: 2400, goal: 2200 },
        { day: 'Sun', calories: 1900, goal: 2200 },
    ];

    // Mock workout data
    const weeklyWorkoutData = [
        { day: 'Mon', duration: 45 },
        { day: 'Tue', duration: 0 },
        { day: 'Wed', duration: 60 },
        { day: 'Thu', duration: 30 },
        { day: 'Fri', duration: 50 },
        { day: 'Sat', duration: 0 },
        { day: 'Sun', duration: 40 },
    ];

    // Mock macros data
    const macrosData = [
        { name: 'Protein', value: 150, color: '#8b5cf6' },
        { name: 'Carbs', value: 200, color: '#3b82f6' },
        { name: 'Fats', value: 65, color: '#10b981' },
    ];

    // Recent activity
    const recentActivity = [
        { type: 'meal', name: 'Grilled Chicken Salad', calories: 450, time: '1 hour ago', icon: Apple },
        { type: 'workout', name: 'Morning Run', duration: '30 min', time: '3 hours ago', icon: Activity },
        { type: 'meal', name: 'Protein Smoothie', calories: 320, time: '5 hours ago', icon: Apple },
        { type: 'workout', name: 'Upper Body Strength', duration: '45 min', time: 'Yesterday', icon: Dumbbell },
    ];

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
        },
    ];

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            navigate('/login');
        }
    };

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
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.initials}</AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
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
                        Welcome back, {user.name.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-gray-600">Here's your fitness overview for today</p>
                </div>

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
                            <p className="text-xs text-gray-500 mt-2">1 more to reach your goal!</p>
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
                                value={((stats.currentWeight - stats.goalWeight) / (stats.currentWeight - stats.goalWeight + 10)) * 100}
                                className="mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-2">{stats.currentWeight - stats.goalWeight} lbs to goal</p>
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
                            <p className="text-xs text-gray-500 mt-2">{stats.waterGoal - stats.waterIntake} cups remaining</p>
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
                                    <AreaChart data={weeklyCalorieData}>
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
                                <CardDescription>Your latest meals and workouts</CardDescription>
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
                                                        {activity.type === 'meal'
                                                            ? `${activity.calories} calories`
                                                            : activity.duration
                                                        } • {activity.time}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Button variant="ghost" className="w-full mt-4">
                                    View All Activity
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
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
                                    className="cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => navigate(feature.href)}
                                >
                                    <CardContent className="p-6">
                                        <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                                        <p className="text-sm text-gray-600 line-clamp-2">{feature.description}</p>
                                        <ChevronRight className="h-4 w-4 text-gray-400 mt-3" />
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
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Complete 1 Workout</span>
                                    <Badge variant="secondary">In Progress</Badge>
                                </div>
                                <Progress value={50} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Log 3 Meals</span>
                                    <Badge className="bg-green-500">Completed</Badge>
                                </div>
                                <Progress value={100} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Drink 8 Cups of Water</span>
                                    <Badge variant="secondary">6/8</Badge>
                                </div>
                                <Progress value={75} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}