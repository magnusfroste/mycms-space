import { useState, useEffect } from 'react';
import { useAboutMeSettings, useUpdateAboutMeSettings } from '@/hooks/useAboutMeSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { iconMap } from '@/lib/constants/iconMaps';

const AboutMeSettings = () => {
  const { data: settings, isLoading } = useAboutMeSettings();
  const updateSettings = useUpdateAboutMeSettings();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    intro_text: '',
    additional_text: '',
    skill1_title: '',
    skill1_description: '',
    skill1_icon: 'Monitor',
    skill2_title: '',
    skill2_description: '',
    skill2_icon: 'Rocket',
    skill3_title: '',
    skill3_description: '',
    skill3_icon: 'Brain',
    image_url: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name,
        intro_text: settings.intro_text,
        additional_text: settings.additional_text,
        skill1_title: settings.skill1_title,
        skill1_description: settings.skill1_description,
        skill1_icon: settings.skill1_icon,
        skill2_title: settings.skill2_title,
        skill2_description: settings.skill2_description,
        skill2_icon: settings.skill2_icon,
        skill3_title: settings.skill3_title,
        skill3_description: settings.skill3_description,
        skill3_icon: settings.skill3_icon,
        image_url: settings.image_url,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateSettings.mutateAsync(formData);
      toast({
        title: "Success",
        description: "About Me settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const iconOptions = Object.keys(iconMap);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your name and profile image</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
            {formData.image_url && (
              <div className="mt-2">
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* About Text */}
      <Card>
        <CardHeader>
          <CardTitle>About Text</CardTitle>
          <CardDescription>Introductory paragraphs about you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="intro_text">Introduction Text</Label>
            <Textarea
              id="intro_text"
              value={formData.intro_text}
              onChange={(e) => setFormData({ ...formData, intro_text: e.target.value })}
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additional_text">Additional Text</Label>
            <Textarea
              id="additional_text"
              value={formData.additional_text}
              onChange={(e) => setFormData({ ...formData, additional_text: e.target.value })}
              rows={4}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Skill 1 */}
      <Card>
        <CardHeader>
          <CardTitle>Skill 1</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skill1_title">Title</Label>
            <Input
              id="skill1_title"
              value={formData.skill1_title}
              onChange={(e) => setFormData({ ...formData, skill1_title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill1_description">Description</Label>
            <Textarea
              id="skill1_description"
              value={formData.skill1_description}
              onChange={(e) => setFormData({ ...formData, skill1_description: e.target.value })}
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill1_icon">Icon</Label>
            <Select
              value={formData.skill1_icon}
              onValueChange={(value) => setFormData({ ...formData, skill1_icon: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    <div className="flex items-center gap-2">
                      {iconMap[icon]}
                      <span>{icon}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Skill 2 */}
      <Card>
        <CardHeader>
          <CardTitle>Skill 2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skill2_title">Title</Label>
            <Input
              id="skill2_title"
              value={formData.skill2_title}
              onChange={(e) => setFormData({ ...formData, skill2_title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill2_description">Description</Label>
            <Textarea
              id="skill2_description"
              value={formData.skill2_description}
              onChange={(e) => setFormData({ ...formData, skill2_description: e.target.value })}
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill2_icon">Icon</Label>
            <Select
              value={formData.skill2_icon}
              onValueChange={(value) => setFormData({ ...formData, skill2_icon: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    <div className="flex items-center gap-2">
                      {iconMap[icon]}
                      <span>{icon}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Skill 3 */}
      <Card>
        <CardHeader>
          <CardTitle>Skill 3</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skill3_title">Title</Label>
            <Input
              id="skill3_title"
              value={formData.skill3_title}
              onChange={(e) => setFormData({ ...formData, skill3_title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill3_description">Description</Label>
            <Textarea
              id="skill3_description"
              value={formData.skill3_description}
              onChange={(e) => setFormData({ ...formData, skill3_description: e.target.value })}
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill3_icon">Icon</Label>
            <Select
              value={formData.skill3_icon}
              onValueChange={(value) => setFormData({ ...formData, skill3_icon: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    <div className="flex items-center gap-2">
                      {iconMap[icon]}
                      <span>{icon}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default AboutMeSettings;
