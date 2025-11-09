import React, { useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Project } from '@/lib/airtable';
import { useNavigate } from 'react-router-dom';
import ProjectModal from './ProjectModal';
import { useProjectsWithFallback } from '@/hooks/useProjectsWithFallback';
import { useAirtableConfig } from '@/hooks/useAirtableConfig';
import { useAnalytics } from '@/hooks/useAnalytics';
import { analyticsService } from '@/services/analyticsService';

const ProjectShowcase = () => {
  const navigate = useNavigate();
  const { projects: sortedProjects, isLoading, error, usingFallbackData } = useProjectsWithFallback();
  const { isConfigured: hasAirtableConfig } = useAirtableConfig();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Track page visit
  useAnalytics('portfolio');

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

  return (
    <section id="projects" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="section-title">My Portfolio - Proof of Concepts & AI Initiatives</h2>
        
        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="animate-pulse text-center">
              <p className="text-muted-foreground">Loading projects from Airtable...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="glass-card p-4 mb-8 text-center">
            <p className="text-destructive">Could not load projects from Airtable. Using fallback data.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button
              onClick={() => navigate('/airtable-config')}
              className="mt-4 apple-button"
            >
              Update Airtable Configuration
            </Button>
          </div>
        )}
        
        {!hasAirtableConfig && !error && !isLoading && (
          <div className="glass-card p-4 mb-8 text-center">
            <p className="text-amber-600 dark:text-amber-400">Using demo projects. Connect your Airtable to display your own projects.</p>
            <Button
              onClick={() => navigate('/airtable-config')}
              className="mt-4 apple-button"
            >
              Set Up Airtable Connection
            </Button>
          </div>
        )}
        
        {usingFallbackData && hasAirtableConfig && !error && !isLoading && (
          <div className="glass-card p-4 mb-8 text-center">
            <p className="text-amber-600 dark:text-amber-400">No projects found in Airtable or empty fields. Using fallback projects.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure your Airtable table has the correct structure with Title/title, Description/description, Image/image, DemoLink/demoLink, and Order/order fields.
            </p>
          </div>
        )}
        
        <div className="space-y-16">
          {sortedProjects.map((project, index) => {
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
