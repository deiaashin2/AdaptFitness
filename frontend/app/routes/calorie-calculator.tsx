import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { ArrowLeft, Calculator, TrendingDown, TrendingUp, Minus } from 'lucide-react';

export default function CalorieCalculator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    age: '',
    heightFeet: '',
    heightInches: '',
    weight: '',
    sex: '',
    activityLevel: '',
    goal: '',
    goalWeight: '',
  });

  const [results, setResults] = useState<{
    bmr: number;
    maintenance: number;
    weightLoss: number;
    weightGain: number;
  } | null>(null);

  // Fetch user's latest calculation on mount
  useEffect(() => {
    if (user) {
      fetchLatestCalculation();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchLatestCalculation = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get latest calculation
      const { data: calcData, error: calcError } = await supabase
        .from('metabolic_calculations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (calcError) {
        console.error('Error fetching calculation:', calcError);
        setLoading(false);
        return;
      }

      // Get latest metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
      }

      // If we have data, populate the form and results
      if (calcData && metricsData) {
        // Populate form
        const totalInches = Number(metricsData.height) / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        const weightLbs = Number(metricsData.weight) / 0.45359237;
        const goalWeightLbs = metricsData.goal_weight
          ? Number(metricsData.goal_weight) / 0.45359237
          : null;

        setFormData({
          age: metricsData.age.toString(),
          heightFeet: feet.toString(),
          heightInches: inches.toString(),
          weight: weightLbs.toFixed(1),
          sex: metricsData.gender,
          activityLevel: mapActivityLevelFromDB(metricsData.activity_level),
          goal: calcData.goal,
          goalWeight: goalWeightLbs ? goalWeightLbs.toFixed(1) : '',
        });

        // Populate results
        setResults({
          bmr: calcData.bmr,
          maintenance: calcData.tdee,
          weightLoss: calcData.goal === 'lose' ? calcData.calorie_goal : calcData.tdee - 500,
          weightGain: calcData.goal === 'gain' ? calcData.calorie_goal : calcData.tdee + 300,
        });

        console.log('Loaded saved calculation and metrics');
      }
    } catch (error) {
      console.error('Error loading calculation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map database activity level to form values
  const mapActivityLevelFromDB = (dbLevel: string): string => {
    const mapping: { [key: string]: string } = {
      'sedentary': 'inactive',
      'lightly_active': 'somewhat-active',
      'moderately_active': 'active',
      'very_active': 'very-active',
    };
    return mapping[dbLevel] || 'inactive';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateCalories = async (e: React.FormEvent) => {
    e.preventDefault();

    const age = parseFloat(formData.age);

    const totalInches =
      parseFloat(formData.heightFeet) * 12 +
      parseFloat(formData.heightInches || '0');

    const height = totalInches * 2.54; // feet/inches -> cm
    const weight = parseFloat(formData.weight) * 0.45359237; // lbs -> kg
    const goalWeightKg = formData.goalWeight
      ? parseFloat(formData.goalWeight) * 0.45359237
      : null;

    // Mifflin-St Jeor Equation for BMR
    let bmr: number;
    if (formData.sex === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers: { [key: string]: number } = {
      inactive: 1.2,
      'somewhat-active': 1.375,
      active: 1.55,
      'very-active': 1.725,
    };

    const maintenance = bmr * activityMultipliers[formData.activityLevel];
    const weightLoss = maintenance - 500; // 500 calorie deficit for ~1lb/week loss
    const weightGain = maintenance + 300; // 300 calorie surplus for controlled gain

    setResults({
      bmr: Math.round(bmr),
      maintenance: Math.round(maintenance),
      weightLoss: Math.round(weightLoss),
      weightGain: Math.round(weightGain),
    });

    // Save to database
    if (user) {
      try {
        console.log('Saving data to Supabase...');

        const activityLevelMap: { [key: string]: string } = {
          'inactive': 'sedentary',
          'somewhat-active': 'lightly_active',
          'active': 'moderately_active',
          'very-active': 'very_active',
        };

        const { error: metricsError } = await supabase
          .from('user_metrics')
          .insert({
            user_id: user.id,
            age: parseInt(formData.age),
            gender: formData.sex,
            weight,
            height,
            activity_level: activityLevelMap[formData.activityLevel],
            unit_system: 'imperial',
            goal_weight: goalWeightKg,
          });

        if (metricsError) {
          console.error('Error saving metrics:', metricsError);
        } else {
          console.log('User metrics saved!');
        }

        let calorieGoal: number;
        if (formData.goal === 'lose') {
          calorieGoal = Math.round(weightLoss);
        } else if (formData.goal === 'gain') {
          calorieGoal = Math.round(weightGain);
        } else {
          calorieGoal = Math.round(maintenance);
        }

        let proteinGrams, carbsGrams, fatGrams;
        if (formData.goal === 'lose') {
          proteinGrams = Math.round((calorieGoal * 0.4) / 4);
          carbsGrams = Math.round((calorieGoal * 0.3) / 4);
          fatGrams = Math.round((calorieGoal * 0.3) / 9);
        } else if (formData.goal === 'gain') {
          proteinGrams = Math.round((calorieGoal * 0.3) / 4);
          carbsGrams = Math.round((calorieGoal * 0.5) / 4);
          fatGrams = Math.round((calorieGoal * 0.2) / 9);
        } else {
          proteinGrams = Math.round((calorieGoal * 0.3) / 4);
          carbsGrams = Math.round((calorieGoal * 0.4) / 4);
          fatGrams = Math.round((calorieGoal * 0.3) / 9);
        }

        const { error: calcError } = await supabase
          .from('metabolic_calculations')
          .insert({
            user_id: user.id,
            goal: formData.goal,
            bmr: Math.round(bmr),
            rmr: Math.round(bmr * 1.1),
            tdee: Math.round(maintenance),
            calorie_goal: calorieGoal,
            protein_grams: proteinGrams,
            carbs_grams: carbsGrams,
            fat_grams: fatGrams,
          });

        if (calcError) {
          console.error('Error saving calculation:', calcError);
        } else {
          console.log('Calculation saved successfully!');
        }
      } catch (error) {
        console.error('Error saving to database:', error);
      }
    }
  };

  const isFormValid = () => {
    return (
      formData.age &&
      formData.heightFeet &&
      formData.heightInches !== '' &&
      formData.weight &&
      formData.sex &&
      formData.activityLevel &&
      formData.goal
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your calculation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <Calculator className="size-6 text-emerald-600" />
              <h1 className="text-2xl font-bold text-emerald-600">Calorie Calculator</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>
                  Enter your details to calculate your daily calorie needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={calculateCalories} className="space-y-6">
                  {/* Age */}
                  <div className="space-y-2">
                    <Label htmlFor="age">Age (years)</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      min="15"
                      max="100"
                      required
                    />
                  </div>

                  {/* Sex */}
                  <div className="space-y-2">
                    <Label>Sex</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleInputChange('sex', 'male')}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          formData.sex === 'male'
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('sex', 'female')}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          formData.sex === 'female'
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  {/* Height */}
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Input
                          id="height-feet"
                          type="number"
                          placeholder="5"
                          value={formData.heightFeet}
                          onChange={(e) => handleInputChange('heightFeet', e.target.value)}
                          min="3"
                          max="8"
                          required
                        />
                        <span className="text-sm text-slate-500">ft</span>
                      </div>

                      <div className="space-y-1">
                        <Input
                          id="height-inches"
                          type="number"
                          placeholder="6"
                          value={formData.heightInches}
                          onChange={(e) => handleInputChange('heightInches', e.target.value)}
                          min="0"
                          max="11"
                          required
                        />
                        <span className="text-sm text-slate-500">in</span>
                      </div>
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="150"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      min="60"
                      max="700"
                      step="0.1"
                      required
                    />
                  </div>

                {/* Goal Weight */}
                <div className="space-y-2">
                    <Label htmlFor="goal-weight">Goal Weight (lbs)</Label>
                    <Input
                        id="goal-weight"
                        type="number"
                        placeholder="e.g., 140"
                        value={formData.goalWeight}
                        onChange={(e) => setFormData({ ...formData, goalWeight: e.target.value })}
                    />
                </div>

                  {/* Activity Level */}
                  <div className="space-y-2">
                    <Label>Activity Level</Label>
                    <div className="space-y-2">
                      {[
                        { value: 'inactive', label: 'Inactive', desc: 'Little or no exercise' },
                        { value: 'somewhat-active', label: 'Somewhat Active', desc: '1-3 days/week' },
                        { value: 'active', label: 'Active', desc: '3-5 days/week' },
                        { value: 'very-active', label: 'Very Active', desc: '6-7 days/week' },
                      ].map((activity) => (
                        <button
                          key={activity.value}
                          type="button"
                          onClick={() => handleInputChange('activityLevel', activity.value)}
                          className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                            formData.activityLevel === activity.value
                              ? 'border-emerald-600 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-medium">{activity.label}</div>
                          <div className="text-sm text-slate-600">{activity.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goal */}
                  <div className="space-y-2">
                    <Label>Goal</Label>
                    <div className="space-y-2">
                      {[
                        { value: 'lose', label: 'Lose Weight', icon: TrendingDown },
                        { value: 'maintain', label: 'Maintain Weight', icon: Minus },
                        { value: 'gain', label: 'Gain Weight', icon: TrendingUp },
                      ].map((goal) => (
                        <button
                          key={goal.value}
                          type="button"
                          onClick={() => handleInputChange('goal', goal.value)}
                          className={`w-full p-3 border-2 rounded-lg flex items-center gap-3 transition-all ${
                            formData.goal === goal.value
                              ? 'border-emerald-600 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <goal.icon className="size-5" />
                          <span className="font-medium">{goal.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={!isFormValid()}
                    onClick={() => navigate('/dashboard')}
                  >
                    Calculate Calories
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div>
            <Card className={results ? 'border-emerald-200' : ''}>
              <CardHeader>
                <CardTitle>Your Results</CardTitle>
                <CardDescription>
                  {results
                    ? 'Based on your information and activity level'
                    : 'Complete the form to see your personalized calorie recommendations'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-6">
                    {/* BMR */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Basal Metabolic Rate (BMR)</div>
                      <div className="text-3xl font-bold text-slate-900">{results.bmr}</div>
                      <div className="text-sm text-slate-500">calories/day at rest</div>
                    </div>
                    
                    {/* Weight Loss */}
                      <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                        formData.goal === 'lose'
                          ? 'bg-orange-50 border-orange-500 ring-4 ring-orange-100 shadow-lg scale-[1.02]'
                          : 'bg-orange-50 border-orange-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingDown className="size-4 text-orange-600" />

                          <div className="text-sm font-medium text-orange-900">
                            Lose Weight
                            {formData.goal === 'lose' && ' (Recommended)'}
                          </div>
                        </div>

                        <div className="text-3xl font-bold text-orange-900">
                          {results.weightLoss}
                        </div>

                        <div className="text-sm text-orange-700">
                          calories/day (~1 lb/week loss)
                        </div>
                      </div>

                    {/* Maintenance Calories */}
                    <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      formData.goal === 'maintain'
                        ? 'bg-blue-50 border-blue-500 ring-4 ring-blue-100 shadow-lg scale-[1.02]'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Minus className="size-4 text-blue-600" />

                        <div className="text-sm font-medium text-blue-900">
                          Maintain Weight
                          {formData.goal === 'maintain' && ' (Recommended)'}
                        </div>
                      </div>

                      <div className="text-3xl font-bold text-blue-900">
                        {results.maintenance}
                      </div>

                      <div className="text-sm text-blue-700">
                        calories/day
                      </div>
                    </div>

                  {/* Weight Gain */}
                  <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    formData.goal === 'gain'
                      ? 'bg-purple-50 border-purple-500 ring-4 ring-purple-100 shadow-lg scale-[1.02]'
                      : 'bg-purple-50 border-purple-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="size-4 text-purple-600" />

                      <div className="text-sm font-medium text-purple-900">
                        Gain Weight
                        {formData.goal === 'gain' && ' (Recommended)'}
                      </div>
                    </div>

                    <div className="text-3xl font-bold text-purple-900">
                      {results.weightGain}
                    </div>

                    <div className="text-sm text-purple-700">
                      calories/day (controlled gain)
                    </div>
                  </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-900">
                        <strong>Note:</strong> These are estimates based on general formulas. 
                        Consult with a healthcare professional for personalized advice.
                      </p>
                    </div>
                    {/* New Calculation button */}
                    <div className="pt-6 flex flex-col gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResults(null);
                          setFormData({
                            age: '',
                            heightFeet: '',
                            heightInches: '',
                            weight: '',
                            sex: '',
                            activityLevel: '',
                            goal: '',
                            goalWeight: '',
                          });
                        }}
                        className="w-full"
                      >
                        Start New Calculation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <Calculator className="size-16 mx-auto mb-4 opacity-20" />
                    <p>Your calorie recommendations will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
