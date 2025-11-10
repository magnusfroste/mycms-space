import React, { useState, useMemo } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/lib/airtable';
import { useNavigate } from 'react-router-dom';
import ProjectModal from './ProjectModal';
import { useProjectsWithFallback } from '@/hooks/useProjectsWithFallback';
import { useAnalytics } from '@/hooks/useAnalytics';
import { analyticsService } from '@/services/analyticsService';
import { useCategories } from '@/hooks/useCategories';
import { usePortfolioSettings } from '@/hooks/usePortfolioSettings';
import { supabase } from '@/integrations/supabase/client';

const ProjectShowcase = () => {
  const navigate = useNavigate();
  const { projects: sortedProjects, isLoading, error, usingFallbackData } = useProjectsWithFallback();
  const { data: categories = [] } = useCategories();
  const { data: portfolioSettings } = usePortfolioSettings();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [projectCategories, setProjectCategories] = useState<Record<string, string[]>>({});
  
  // Track page visit
  useAnalytics('portfolio');

  // Fetch project categories
  React.useEffect(() => {
    const fetchProjectCategories = async () => {
      const { data } = await supabase
        .from('project_categories')
        .select('project_id, category_id');
      
      if (data) {
        const categoriesMap: Record<string, string[]> = {};
        data.forEach((pc: any) => {
          if (!categoriesMap[pc.project_id]) {
            categoriesMap[pc.project_id] = [];
          }
          categoriesMap[pc.project_id].push(pc.category_id);
        });
        setProjectCategories(categoriesMap);
      }
    };
    
    fetchProjectCategories();
  }, []);

  // Filter projects by selected category
  const filteredProjects = useMemo(() => {
    if (!selectedCategory) return sortedProjects;
    
    return sortedProjects.filter(project => 
      projectCategories[project.id]?.includes(selectedCategory)
    );
  }, [sortedProjects, selectedCategory, projectCategories]);

  const handleDemoClick = (projectTitle: string, demoLink: string) => {
    analyticsService.trackDemoClick(projectTitle);
    
    if (demoLink.startsWith('#')) {
      const element = document.querySelector(demoLink);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleViewMore = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  // Don't render section if hidden
  if (portfolioSettings?.show_section === false) {
    return null;
  }

  return (
    <section id="projects" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="section-title">
            {portfolioSettings?.section_title || 'My Portfolio - Proof of Concepts & AI Initiatives'}
          </h2>
          {portfolioSettings?.section_subtitle && (
            <p className="text-xl text-muted-foreground mt-2">
              {portfolioSettings.section_subtitle}
            </p>
          )}
          {portfolioSettings?.section_description && (
            <p className="text-base text-muted-foreground mt-4 max-w-3xl mx-auto">
              {portfolioSettings.section_description}
            </p>
          )}
        </div>
        
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedCategory(null)}
            >
              All Projects
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="animate-pulse text-center">
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="glass-card p-4 mb-8 text-center">
            <p className="text-destructive">Could not load projects. Using fallback data.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button
              onClick={() => navigate('/admin')}
              className="mt-4 apple-button"
            >
              Go to Admin Panel
            </Button>
          </div>
        )}
        
        {usingFallbackData && !error && !isLoading && (
          <div className="glass-card p-4 mb-8 text-center">
            <p className="text-amber-600 dark:text-amber-400">No projects found. Using demo projects.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add your projects in the admin panel to display them here.
            </p>
            <Button
              onClick={() => navigate('/admin')}
              className="mt-4 apple-button"
            >
              Manage Projects
            </Button>
          </div>
        )}
        
        <div className="space-y-16">
          {filteredProjects.length === 0 && selectedCategory && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No projects found in this category.</p>
            </div>
          )}
          {filteredProjects.map((project, index) => {
            const isImageOnLeft = index % 2 === 0;
            
            return (
              <div 
                key={project.id} 
                className="glass-card overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                id={`demo-${project.title.toLowerCase().split(' ').slice(0, 2).join('-')}`}
                onClick={() => handleViewMore(project)}
              >
                <div className={`grid grid-cols-1 ${isImageOnLeft ? 'lg:grid-cols-[3fr,2fr]' : 'lg:grid-cols-[2fr,3fr]'}`}>
                  {isImageOnLeft ? (
                    <>
                      <div className="bg-muted min-h-[300px] lg:min-h-[400px] p-6 flex items-center justify-center">
                        {project.image ? (
                          <img 
                            src={project.image} 
                            alt={project.title}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No image available
                          </div>
                        )}
                      </div>
                      <div className="p-8 flex flex-col justify-center">
                        <h3 className="text-2xl font-semibold mb-4">{project.title}</h3>
                        <p className="text-muted-foreground mb-6">{project.description}</p>
                        <div className="flex space-x-3">
                          <Button 
                            className="apple-button flex items-center gap-2" 
                            asChild
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent the card click from triggering
                              if (project.demoLink.startsWith('#')) {
                                e.preventDefault();
                                handleDemoClick(project.title, project.demoLink);
                              } else {
                                handleDemoClick(project.title, project.demoLink);
                              }
                            }}
                          >
                            <a 
                              href={project.demoLink.startsWith('#') ? undefined : project.demoLink} 
                              target={project.demoLink.startsWith('#') ? undefined : "_blank"} 
                              rel={project.demoLink.startsWith('#') ? undefined : "noopener noreferrer"}
                            >
                              Demo
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation(); // This is redundant as the parent handler would be the same
                              handleViewMore(project);
                            }}
                          >
                            View More
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-8 flex flex-col justify-center">
                        <h3 className="text-2xl font-semibold mb-4">{project.title}</h3>
                        <p className="text-muted-foreground mb-6">{project.description}</p>
                        <div className="flex space-x-3">
                          <Button 
                            className="apple-button flex items-center gap-2" 
                            asChild
                            onClick={(e) => {
                              e.stopPropagation();
                              if (project.demoLink.startsWith('#')) {
                                e.preventDefault();
                                handleDemoClick(project.title, project.demoLink);
                              } else {
                                handleDemoClick(project.title, project.demoLink);
                              }
                            }}
                          >
                            <a 
                              href={project.demoLink.startsWith('#') ? undefined : project.demoLink} 
                              target={project.demoLink.startsWith('#') ? undefined : "_blank"} 
                              rel={project.demoLink.startsWith('#') ? undefined : "noopener noreferrer"}
                            >
                              Demo
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewMore(project);
                            }}
                          >
                            View More
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted min-h-[300px] lg:min-h-[400px] p-6 flex items-center justify-center">
                        {project.image ? (
                          <img 
                            src={project.image} 
                            alt={project.title}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No image available
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          isOpen={!!selectedProject}
          onClose={handleCloseModal}
        />
      )}
    </section>
  );
};

export default ProjectShowcase;
