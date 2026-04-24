import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { ArrowLeft, Plus, Search, Trash2, Apple, Coffee, UtensilsCrossed, Pizza } from 'lucide-react';
import { Badge } from '../components/ui/badge';

interface MealEntry {
  id: string;
  user_id?: string;
  meal_name: string;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_date: string;
  created_at?: string;
}

export default function NutritionLog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [calorieGoal, setCalorieGoal] = useState<number>(2000);
  const [yesterdaysMeals, setYesterdaysMeals] = useState<MealEntry[]>([]);
  
  const [newMeal, setNewMeal] = useState({
    meal_name: '',
    calories: '',
    protein_grams: '',
    carbs_grams: '',
    fat_grams: '',
    meal_type: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
  });

  const [meals, setMeals] = useState<MealEntry[]>([]);

  // Fetch today's meals on mount
useEffect(() => {
  if (user) {
    fetchTodaysMeals();
    fetchYesterdaysMeals();
    fetchCalorieGoal();
  }
}, [user]);

const fetchCalorieGoal = async () => {
  if (!user) return;

  const { data, error } = await supabase
    .from('metabolic_calculations')
    .select('calorie_goal, tdee, goal')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    if (data.goal === 'maintain') {
      setCalorieGoal(data.tdee);
    } else {
      setCalorieGoal(data.calorie_goal);
    }
  }
};

const fetchTodaysMeals = async () => {
  if (!user) return;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('meal_date', todayStart.toISOString())
      .lte('meal_date', todayEnd.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meals:', error);
    } else {
      setMeals(data || []);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

const fetchYesterdaysMeals = async () => {
  if (!user) return;

  const yesterdayStart = new Date();
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date();
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('meal_date', yesterdayStart.toISOString())
    .lte('meal_date', yesterdayEnd.toISOString())
    .order('created_at', { ascending: false });

  if (!error && data) setYesterdaysMeals(data);
};

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein_grams || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs_grams || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.fat_grams || 0), 0);

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      console.error('User not logged in');
      alert('You must be logged in to add meals.');
      return;
    }
  
    try {
      console.log('Saving meal to Supabase...');
  
      const mealData = {
        user_id: user.id,
        meal_name: newMeal.meal_name.trim(),
        calories: parseFloat(newMeal.calories),
        protein_grams: parseFloat(newMeal.protein_grams),
        carbs_grams: parseFloat(newMeal.carbs_grams),
        fat_grams: parseFloat(newMeal.fat_grams),
        meal_type: newMeal.meal_type,
        meal_date: new Date().toISOString(),
      };
  
      console.log('Meal data:', mealData);
  
      const { data, error } = await supabase
        .from('meal_logs')
        .insert(mealData)
        .select()
        .single();
  
      if (error) {
        console.error('Supabase error:', error);
        alert(`Failed to save meal: ${error.message}`);
        return;
      }
  
      console.log('Meal saved successfully!', data);
      
      // Add to local state
      if (data) {
        setMeals([data, ...meals]);
      }
      
      // Reset form
      setNewMeal({
        meal_name: '',
        calories: '',
        protein_grams: '',
        carbs_grams: '',
        fat_grams: '',
        meal_type: 'breakfast',
      });
      setIsAddingMeal(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      alert(`An error occurred: ${error}`);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      console.log('Deleting meal...');
  
      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', id);
  
      if (error) {
        console.error('Error deleting meal:', error);
        alert('Failed to delete meal.');
      } else {
        console.log('Meal deleted!');
        setMeals(meals.filter(meal => meal.id !== id));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return Coffee;
      case 'lunch':
        return UtensilsCrossed;
      case 'dinner':
        return Pizza;
      case 'snack':
        return Apple;
      default:
        return UtensilsCrossed;
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'lunch':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'dinner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'snack':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredMeals = meals.filter(meal =>
    meal.meal_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your meals...</p>
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
              <UtensilsCrossed className="size-6 text-green-600" />
              <h1 className="text-2xl font-bold text-emerald-600">Nutrition Log</h1>
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
                {/* Calorie Progress */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm font-medium text-slate-700">Calories</span>
                    <span className="text-2xl font-bold text-green-600">{totalCalories}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min((totalCalories / calorieGoal) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {calorieGoal - totalCalories} remaining of {calorieGoal} goal
                  </p>
                </div>

                {/* Macros */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Macronutrients</h4>
                  
                  {/* Protein */}
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Protein</span>
                    <span className="text-lg font-bold text-blue-900">{totalProtein}g</span>
                  </div>

                  {/* Carbs */}
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <span className="text-sm font-medium text-amber-900">Carbs</span>
                    <span className="text-lg font-bold text-amber-900">{totalCarbs}g</span>
                  </div>

                  {/* Fat */}
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-900">Fat</span>
                    <span className="text-lg font-bold text-purple-900">{totalFat}g</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Meals logged:</span>
                      <span className="font-medium">{meals.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meals List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Add */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search meals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-emerald-600"
                />
              </div>
              <Button
                onClick={() => setIsAddingMeal(true)}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Plus className="size-4" />
                Add Meal
              </Button>
            </div>

            {/* Add Meal Form */}
            {isAddingMeal && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle>Add New Meal</CardTitle>
                  <CardDescription>Enter the nutritional information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddMeal} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meal-name">Meal Name</Label>
                      <Input
                        id="meal-name"
                        placeholder="e.g., Chicken Breast"
                        value={newMeal.meal_name}
                        onChange={(e) => setNewMeal({ ...newMeal, meal_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Meal Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'breakfast', label: 'Breakfast' },
                          { value: 'lunch', label: 'Lunch' },
                          { value: 'dinner', label: 'Dinner' },
                          { value: 'snack', label: 'Snack' },
                        ].map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setNewMeal({ ...newMeal, meal_type: type.value as any })}
                            className={`p-2 border-2 rounded-lg text-sm transition-all ${
                              newMeal.meal_type === type.value
                                ? 'border-green-600 bg-green-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="calories">Calories</Label>
                        <Input
                          id="calories"
                          type="number"
                          placeholder="0"
                          value={newMeal.calories}
                          onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="protein">Protein (g)</Label>
                        <Input
                          id="protein"
                          type="number"
                          placeholder="0"
                          value={newMeal.protein_grams}
                          onChange={(e) => setNewMeal({ ...newMeal, protein_grams: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="carbs">Carbs (g)</Label>
                        <Input
                          id="carbs"
                          type="number"
                          placeholder="0"
                          value={newMeal.carbs_grams}
                          onChange={(e) => setNewMeal({ ...newMeal, carbs_grams: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fat">Fat (g)</Label>
                        <Input
                          id="fat"
                          type="number"
                          placeholder="0"
                          value={newMeal.fat_grams}
                          onChange={(e) => setNewMeal({ ...newMeal, fat_grams: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                        Add Meal
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddingMeal(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Meals */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Meals</CardTitle>
                <CardDescription>All meals logged for today</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredMeals.length > 0 ? (
                  <div className="space-y-3">
                    {filteredMeals.map((meal) => {
                      const Icon = getMealIcon(meal.meal_type);
                      return (
                        <div
                          key={meal.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className={`p-3 rounded-lg ${getMealTypeColor(meal.meal_type)}`}>
                            <Icon className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900">{meal.meal_name}</h4>
                              <Badge variant="outline" className="text-xs capitalize">
                                {meal.meal_type}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-slate-600">
                              <span className="font-medium text-slate-900">{meal.calories} cal</span>
                              <span>P: {meal.protein_grams}g</span>
                              <span>C: {meal.carbs_grams}g</span>
                              <span>F: {meal.fat_grams}g</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1"></p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <UtensilsCrossed className="size-16 mx-auto mb-4 opacity-20" />
                    <p>No meals logged yet</p>
                    <Button
                      variant="ghost"
                      onClick={() => setIsAddingMeal(true)}
                      className="mt-4"
                    >
                      Add your first meal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Yesterday's Meals - separate card */}
            {yesterdaysMeals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Yesterday's Meals</CardTitle>
                  <CardDescription>
                    {new Date(Date.now() - 86400000).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                    })} · {yesterdaysMeals.reduce((sum, m) => sum + (m.calories || 0), 0)} cal total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {yesterdaysMeals.map((meal) => {
                      const Icon = getMealIcon(meal.meal_type);
                      return (
                        <div key={meal.id} className="flex items-center gap-4 p-4 border rounded-lg opacity-75">
                          <div className={`p-3 rounded-lg ${getMealTypeColor(meal.meal_type)}`}>
                            <Icon className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900">{meal.meal_name}</h4>
                              <Badge variant="outline" className="text-xs capitalize">{meal.meal_type}</Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-slate-600">
                              <span className="font-medium text-slate-900">{meal.calories} cal</span>
                              <span>P: {meal.protein_grams}g</span>
                              <span>C: {meal.carbs_grams}g</span>
                              <span>F: {meal.fat_grams}g</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
