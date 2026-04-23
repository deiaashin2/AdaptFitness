import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { ArrowLeft, Plus, Search, Trash2, Dumbbell, Timer, TrendingUp, Activity } from 'lucide-react';
import { Badge } from '../components/ui/badge';

interface Exercise {
  id: string;
  user_id?: string
  exercise_type: string
  sets: number;
  reps: number;
  weight?: number;
  duration_minutes?: number;
  exercise_date: string;
  created_at?: string;
}

export default function FitnessLog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [newExercise, setNewExercise] = useState({
    exercise_type: '',
    sets: '',
    reps: '',
    weight: '',
    duration_minutes: '',
  });

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [weeklyExercises, setWeeklyExercises] = useState<Exercise[]>([]);

  // Fetch today's exercises on mount
  useEffect(() => {
    if (user) {
      fetchTodaysExercises();
      fetchWeeklyExercises();
    }
  }, [user]);

  const fetchTodaysExercises = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('exercise_date', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exercises:', error);
      } else {
        setExercises(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyExercises = async () => {
    if (!user) return;
  
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
  
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('exercise_date', weekStart.toISOString())
      .order('exercise_date', { ascending: true });
  
    if (!error && data) setWeeklyExercises(data);
  };

  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration_minutes || 0), 0);

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      console.error('User not logged in');
      alert('You must be logged in to add exercises.');
      return;
    }
  
    try {
      console.log('Saving exercise to Supabase...');
      console.log('User ID:', user.id);
  
      const exerciseData = {
        user_id: user.id,
        exercise_type: newExercise.exercise_type,
        sets: parseInt(newExercise.sets),
        reps: parseInt(newExercise.reps),
        weight: newExercise.weight ? parseFloat(newExercise.weight) : null,
        duration_minutes: newExercise.duration_minutes ? parseFloat(newExercise.duration_minutes) : null,
        exercise_date: new Date().toISOString(),
      };

      console.log('Exercise data:', exerciseData);
  
      const { data, error } = await supabase
        .from('exercise_logs')
        .insert(exerciseData)
        .select()
        .single();
  
        if (error) {
          console.error('Supabase error:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          alert(`Failed to save exercise: ${error.message}`);
          return;
        }
    
        console.log('Exercise saved successfully!', data);
        
        // Add to local state
        if (data) {
          setExercises([data, ...exercises]);
        }
        
        // Reset form
        setNewExercise({
          exercise_type: '',
          sets: '',
          reps: '',
          weight: '',
          duration_minutes: '',
        });
        setIsAddingExercise(false);
      } catch (error) {
        console.error('Unexpected error:', error);
        alert(`An error occurred: ${error}`);
      }
  };

  const handleDeleteExercise = async (id: string) => {
    try {
      console.log('🗑️ Deleting exercise...');
  
      const { error } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('id', id);
  
      if (error) {
        console.error('Error deleting exercise:', error);
        alert('Failed to delete exercise.');
      } else {
        console.log('Exercise deleted!');
        setExercises(exercises.filter(ex => ex.id !== id));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.exercise_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your exercises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Dumbbell className="size-6 text-emerald-600" />
              <h1 className="text-2xl font-bold text-emerald-600">Fitness Log</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Daily Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="size-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Exercises</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{totalExercises}</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="size-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Total Sets</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{totalSets}</p>
                  </div>
                </div>

                {/* Workout Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Workout Breakdown</h4>

                  {/* Duration */}
                  {totalDuration > 0 && (
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Timer className="size-4 text-amber-700" />
                        <span className="text-sm font-medium text-amber-900">Duration</span>
                      </div>
                      <span className="text-lg font-bold text-amber-900">{totalDuration} min</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="p-3 bg-linear-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-900 mb-1">Keep it up! 💪</p>
                    <p className="text-xs text-purple-700">
                      You've logged {totalExercises} exercises today
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exercise List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Add */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-emerald-600"
                />
              </div>
              <Button
                onClick={() => setIsAddingExercise(true)}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Plus className="size-4" />
                Add Exercise
              </Button>
            </div>

            {/* Add Exercise Form */}
            {isAddingExercise && (
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle>Add New Exercise</CardTitle>
                  <CardDescription>Log your workout details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddExercise} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="exercise-name">Exercise Name</Label>
                      <Input
                        id="exercise-name"
                        placeholder="e.g., Bench Press, Running, Yoga"
                        value={newExercise.exercise_type}
                        onChange={(e) => setNewExercise({ ...newExercise, exercise_type: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sets">Sets</Label>
                        <Input
                          id="sets"
                          type="number"
                          placeholder="0"
                          value={newExercise.sets}
                          onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reps">Reps</Label>
                        <Input
                          id="reps"
                          type="number"
                          placeholder="0"
                          value={newExercise.reps}
                          onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (lbs) - Optional</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="0"
                          value={newExercise.weight}
                          onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (min) - Optional</Label>
                        <Input
                          id="duration"
                          type="number"
                          placeholder="0"
                          value={newExercise.duration_minutes}
                          onChange={(e) => setNewExercise({ ...newExercise, duration_minutes: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
                        Add Exercise
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddingExercise(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Exercises */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Workout</CardTitle>
                <CardDescription>All exercises logged for today</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredExercises.length > 0 ? (
                  <div className="space-y-3">
                    {filteredExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className='p-3 rounded-lg bg-emerald-50 border border-emerald-200'>
                          <Dumbbell className="size-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 mb-1">{exercise.exercise_type || 'Exercise'}</h4>
                          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                            <span>{exercise.sets} sets</span>
                            <span>{exercise.reps} reps</span>
                          {exercise.weight && (
                            <span className="font-medium text-slate-900">{exercise.weight} lbs</span>
                          )}
                          {exercise.duration_minutes && (
                            <span className="flex items-center gap-1">
                            <Timer className="size-3" />
                            {exercise.duration_minutes} min
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(exercise.exercise_date).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Dumbbell className="size-16 mx-auto mb-4 opacity-20" />
                    <p>No exercises logged yet</p>
                    <Button
                      variant="ghost"
                      onClick={() => setIsAddingExercise(true)}
                      className="mt-4"
                    >
                      Log your first exercise
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* This Week's Workouts */}
{weeklyExercises.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>This Week's Workouts</CardTitle>
      <CardDescription>
        {weeklyExercises.length} exercises logged this week
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {(() => {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const grouped: { [key: string]: Exercise[] } = {};

          weeklyExercises.forEach(ex => {
            const day = days[new Date(ex.exercise_date).getDay()];
            if (!grouped[day]) grouped[day] = [];
            grouped[day].push(ex);
          });

          return Object.entries(grouped).map(([day, exs]) => (
            <div key={day}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-700">{day}</h4>
                <Badge variant="outline" className="text-xs">
                  {exs.length} exercise{exs.length > 1 ? 's' : ''} · {exs.reduce((s, e) => s + (e.sets || 0), 0)} sets
                </Badge>
              </div>
              <div className="space-y-2">
                {exs.map(exercise => (
                  <div key={exercise.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <Dumbbell className="size-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">{exercise.exercise_type}</p>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span>{exercise.sets} sets</span>
                        <span>{exercise.reps} reps</span>
                        {exercise.weight && <span>{exercise.weight} lbs</span>}
                        {exercise.duration_minutes && <span>{exercise.duration_minutes} min</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>
    </CardContent>
  </Card>
)}
          </div>
        </div>
      </div>
    </div>
  );
}
