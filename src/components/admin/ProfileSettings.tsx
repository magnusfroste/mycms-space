import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Camera } from 'lucide-react';
import MediaHubPicker from './MediaHubPicker';
import type { MediaFile } from '@/models/mediaHub';
import type { Json } from '@/integrations/supabase/types';

interface ProfileData {
  display_name: string;
  bio: string;
  avatar_url: string;
  website: string;
  social_twitter: string;
  social_linkedin: string;
}

export default function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    bio: '',
    avatar_url: '',
    website: '',
    social_twitter: '',
    social_linkedin: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Try to get existing profile from modules table
      const { data, error } = await supabase
        .from('modules')
        .select('module_config')
        .eq('module_type', 'author_profile')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.module_config) {
        const config = data.module_config as Record<string, unknown>;
        setProfile({
          display_name: (config.display_name as string) || '',
          bio: (config.bio as string) || '',
          avatar_url: (config.avatar_url as string) || '',
          website: (config.website as string) || '',
          social_twitter: (config.social_twitter as string) || '',
          social_linkedin: (config.social_linkedin as string) || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert to Json-compatible format
      const configData: Json = {
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        website: profile.website,
        social_twitter: profile.social_twitter,
        social_linkedin: profile.social_linkedin,
      };

      // Check if profile exists
      const { data: existing } = await supabase
        .from('modules')
        .select('id')
        .eq('module_type', 'author_profile')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('modules')
          .update({
            module_config: configData,
            enabled: true,
          })
          .eq('module_type', 'author_profile');
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('modules')
          .insert({
            module_type: 'author_profile',
            module_config: configData,
            enabled: true,
          });
        if (error) throw error;
      }

      toast({
        title: 'Profile saved',
        description: 'Your author profile has been updated.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = (file: MediaFile) => {
    setProfile(prev => ({ ...prev, avatar_url: file.publicUrl }));
    setShowMediaPicker(false);
  };

  const getInitials = () => {
    if (profile.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your author profile that appears on blog posts and content.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Author Profile
          </CardTitle>
          <CardDescription>
            This information is displayed as the author on your blog posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMediaPicker(true)}
              >
                <Camera className="h-4 w-4 mr-2" />
                Change Avatar
              </Button>
              {profile.avatar_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProfile(prev => ({ ...prev, avatar_url: '' }))}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={profile.display_name}
              onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="Your name as it appears to readers"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="A short bio about yourself..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              A brief description that may appear on your blog posts or author page.
            </p>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={profile.website}
              onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Social Links */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="social_twitter">Twitter/X</Label>
              <Input
                id="social_twitter"
                value={profile.social_twitter}
                onChange={(e) => setProfile(prev => ({ ...prev, social_twitter: e.target.value }))}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_linkedin">LinkedIn</Label>
              <Input
                id="social_linkedin"
                value={profile.social_linkedin}
                onChange={(e) => setProfile(prev => ({ ...prev, social_linkedin: e.target.value }))}
                placeholder="linkedin.com/in/username"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Media Picker Modal */}
      <MediaHubPicker
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={handleAvatarSelect}
        selectedUrl={profile.avatar_url}
      />
    </div>
  );
}
