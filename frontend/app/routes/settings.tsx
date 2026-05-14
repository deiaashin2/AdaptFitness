import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, User, Mail, Calendar, Pencil, Check, X } from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    name: string | null;
}

interface UserMetrics {
    age: number;
    gender: string;
    weight: number;
    height: number;
}

export default function Settings() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [metrics, setMetrics] = useState<UserMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [nameSuccess, setNameSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    const fetchUserData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setNewName(profileData.name || '');
            }

            const { data: metricsData } = await supabase
                .from('user_metrics')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (metricsData) {
                setMetrics(metricsData);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveName = async () => {
        if (!user) return;

        const trimmed = newName.trim();
        if (trimmed.length === 0) {
            setNameError('Name cannot be empty');
            return;
        }
        if (trimmed.length > 50) {
            setNameError('Name must be 50 characters or fewer');
            return;
        }

        try {
            setSavingName(true);
            setNameError(null);

            const { error } = await supabase
                .from('profiles')
                .update({ name: trimmed })
                .eq('id', user.id);

            if (error) throw error;

            setProfile((prev) => (prev ? { ...prev, name: trimmed } : prev));
            setIsEditingName(false);
            setNameSuccess(true);
            setTimeout(() => setNameSuccess(false), 2000);
        } catch (err: any) {
            console.error('Error updating name:', err);
            setNameError(err?.message ?? 'Failed to update name');
        } finally {
            setSavingName(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingName(false);
        setNewName(profile?.name || '');
        setNameError(null);
    };

    const getDisplayName = () => {
        return (
            profile?.name ||
            user?.user_metadata?.name ||
            user?.email?.split('@')[0] ||
            'User'
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Loading your settings…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>
                            Your personal details linked to this account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Username (editable) */}
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-500 mt-1" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Username</p>
                                {isEditingName ? (
                                    <div className="mt-2 space-y-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your name"
                                            maxLength={50}
                                            disabled={savingName}
                                        />
                                        {nameError && (
                                            <p className="text-sm text-red-600">{nameError}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSaveName}
                                                disabled={savingName}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                {savingName ? 'Saving…' : 'Save'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCancelEdit}
                                                disabled={savingName}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-base font-medium text-gray-900">
                                            {getDisplayName()}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditingName(true)}
                                        >
                                            <Pencil className="h-3 w-3 mr-1" />
                                            Edit
                                        </Button>
                                        {nameSuccess && (
                                            <span className="text-sm text-green-600">Saved!</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-gray-500 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="text-base font-medium text-gray-900">
                                    {user?.email ?? '—'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-500 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500">Age</p>
                                <p className="text-base font-medium text-gray-900">
                                    {metrics?.age != null
                                        ? `${metrics.age} years`
                                        : 'Not set — update from the Calorie Calculator'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}