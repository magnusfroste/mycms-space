// ============================================
// Project Showcase Block
// Reads projects from block_config JSONB
// Applies global settings from ProjectsModule
// ============================================

import React, { useState, useMemo } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import ProjectModal from '@/components/ProjectModal';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useProjectsModule } from '@/models/modules';
import type { ProjectShowcaseBlockConfig } from '@/types/blockConfigs';
import type { DisplayProject } from '@/types/displayProject';

interface ProjectShowcaseBlockProps {
  config: Record<string, unknown>;
}

const ProjectShowcaseBlock: React.FC<ProjectShowcaseBlockProps> = ({ config }) => {
  const typedConfig = config as ProjectShowcaseBlockConfig;
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<DisplayProject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get global module settings
  const { config: moduleConfig, isEnabled: moduleEnabled } = useProjectsModule();
  
  useAnalytics('portfolio');

  const sectionTitle = typedConfig.section_title || 'Portfolio';
  const sectionSubtitle = typedConfig.section_subtitle;
  const sectionDescription = typedConfig.section_description;
  const showSection = typedConfig.show_section ?? true;
  const categories = typedConfig.categories?.filter(c => c.enabled) || [];
  const projects = typedConfig.projects?.filter(p => p.enabled) || [];
  
  // Module settings with fallbacks
  const layoutStyle = moduleConfig?.layout_style ?? 'alternating';
  const showCategories = moduleConfig?.show_categories ?? true;

  // Filter projects by selected category
  const filteredProjects = useMemo(() => {
    if (!selectedCategory) return projects;
    const selectedCat = categories.find(c => c.id === selectedCategory);
    if (!selectedCat) return projects;
    return projects.filter(project => 
      project.categories?.includes(selectedCat.slug)
    );
  }, [projects, selectedCategory, categories]);

  const handleDemoClick = (projectTitle: string, demoLink: string) => {
    console.log(`Demo clicked: ${projectTitle}`);
    if (demoLink.startsWith('#')) {
      const element = document.querySelector(demoLink);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleViewMore = (project: typeof projects[0]) => {
    setSelectedProject({
      id: project.id,
      title: project.title,
      description: project.description,
      demoLink: project.demo_link,
      image: project.images?.[0]?.image_url || undefined,
      images: project.images?.map(img => img.image_url) || [],
      problemStatement: project.problem_statement,
      whyBuilt: project.why_built,
    });
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  // Hide entire section if module is disabled
  if (!moduleEnabled || !showSection) {
    return null;
  }

  const isLoading = !typedConfig.projects;

  return (
    <section id="projects" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="section-title">{sectionTitle}</h2>
          {sectionSubtitle && (
            <p className="text-xl text-muted-foreground mt-2">
              {sectionSubtitle}
            </p>
          )}
          {sectionDescription && (
            <p className="text-base text-muted-foreground mt-4 max-w-3xl mx-auto">
              {sectionDescription}
            </p>
          )}
        </div>
        
        {/* Category Filter - respects module setting */}
        {showCategories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedCategory(null)}
            >
              All Projects
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
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

        {projects.length === 0 && !isLoading && (
          <div className="glass-card p-4 mb-8 text-center">
            <p className="text-amber-600 dark:text-amber-400">No projects found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add projects in the admin panel to display them here.
            </p>
            <Button
              onClick={() => navigate('/admin')}
              className="mt-4 apple-button"
            >
              Manage Projects
            </Button>
          </div>
        )}
        
        {/* Layout based on module settings */}
        {layoutStyle === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const projectImage = project.images?.[0]?.image_url;
              return (
                <div
                  key={project.id}
                  className="glass-card overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => handleViewMore(project)}
                >
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {projectImage ? (
                      <img
                        src={projectImage}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm">No image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Alternating layout (default) */
          <div className="space-y-16">
            {filteredProjects.length === 0 && selectedCategory && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No projects found in this category.</p>
              </div>
            )}
            {filteredProjects.map((project, index) => {
              const isImageOnLeft = index % 2 === 0;
              const projectImage = project.images?.[0]?.image_url;

              return (
                <div
                  key={project.id}
                  className="glass-card overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                  id={`demo-${project.title.toLowerCase().split(' ').slice(0, 2).join('-')}`}
                  onClick={() => handleViewMore(project)}
                >
                  <div
                    className={`grid grid-cols-1 ${isImageOnLeft ? 'lg:grid-cols-[3fr,2fr]' : 'lg:grid-cols-[2fr,3fr]'}`}
                  >
                    {isImageOnLeft ? (
                      <>
                        <div className="bg-muted min-h-[300px] lg:min-h-[400px] p-6 flex items-center justify-center">
                          {projectImage ? (
                            <img
                              src={projectImage}
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
                                e.stopPropagation();
                                if (project.demo_link.startsWith('#')) {
                                  e.preventDefault();
                                  handleDemoClick(project.title, project.demo_link);
                                } else {
                                  handleDemoClick(project.title, project.demo_link);
                                }
                              }}
                            >
                              <a
                                href={project.demo_link.startsWith('#') ? undefined : project.demo_link}
                                target={project.demo_link.startsWith('#') ? undefined : '_blank'}
                                rel={project.demo_link.startsWith('#') ? undefined : 'noopener noreferrer'}
                              >
                                Link
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
                                if (project.demo_link.startsWith('#')) {
                                  e.preventDefault();
                                  handleDemoClick(project.title, project.demo_link);
                                } else {
                                  handleDemoClick(project.title, project.demo_link);
                                }
                              }}
                            >
                              <a
                                href={project.demo_link.startsWith('#') ? undefined : project.demo_link}
                                target={project.demo_link.startsWith('#') ? undefined : '_blank'}
                                rel={project.demo_link.startsWith('#') ? undefined : 'noopener noreferrer'}
                              >
                                Link
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
                          {projectImage ? (
                            <img
                              src={projectImage}
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
        )}
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

export default ProjectShowcaseBlock;
