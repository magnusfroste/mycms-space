// ============================================
// Project Showcase Block - 2026 Design System
// Modern grid with hover effects and glass cards
// ============================================

import React, { useState, useMemo } from 'react';
import { ExternalLink, Info, ArrowUpRight } from 'lucide-react';
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
  
  const { config: moduleConfig, isEnabled: moduleEnabled } = useProjectsModule();
  
  useAnalytics('portfolio');

  const sectionTitle = typedConfig.section_title || 'Portfolio';
  const sectionSubtitle = typedConfig.section_subtitle;
  const sectionDescription = typedConfig.section_description;
  const showSection = typedConfig.show_section ?? true;
  const categories = typedConfig.categories?.filter(c => c.enabled) || [];
  const projects = typedConfig.projects?.filter(p => p.enabled) || [];
  
  const layoutStyle = moduleConfig?.layout_style ?? 'grid';
  const showCategories = moduleConfig?.show_categories ?? true;

  const filteredProjects = useMemo(() => {
    if (!selectedCategory) return projects;
    const selectedCat = categories.find(c => c.id === selectedCategory);
    if (!selectedCat) return projects;
    return projects.filter(project => 
      project.categories?.includes(selectedCat.slug)
    );
  }, [projects, selectedCategory, categories]);

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

  if (!moduleEnabled || !showSection) {
    return null;
  }

  const isLoading = !typedConfig.projects;

  return (
    <section id="projects" className="section-container relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
            Work
          </span>
          <h2 
            className="section-title animate-fade-in" 
            style={{ animationDelay: '0.1s' }}
          >
            {sectionTitle}
          </h2>
          {sectionSubtitle && (
            <p 
              className="text-xl text-muted-foreground mt-4 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              {sectionSubtitle}
            </p>
          )}
          {sectionDescription && (
            <p 
              className="section-subtitle mt-4 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              {sectionDescription}
            </p>
          )}
        </div>
        
        {/* Category Filter */}
        {showCategories && categories.length > 0 && (
          <div 
            className="flex flex-wrap gap-3 mb-12 justify-center animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-foreground text-background shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-foreground text-background shadow-lg'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-pulse text-center">
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        )}

        {projects.length === 0 && !isLoading && (
          <div className="elevated-card p-8 text-center max-w-md mx-auto">
            <p className="text-muted-foreground mb-4">No projects found.</p>
            <Button onClick={() => navigate('/admin')} className="btn-primary">
              Add Projects
            </Button>
          </div>
        )}
        
        {/* Grid Layout */}
        {layoutStyle === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => {
              const projectImage = project.images?.[0]?.image_url;
              return (
                <article
                  key={project.id}
                  className="group glow-card overflow-hidden cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  onClick={() => handleViewMore(project)}
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                    {projectImage ? (
                      <img
                        src={projectImage}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Quick action */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Alternating Layout */}
        {layoutStyle === 'alternating' && (
          <div className="space-y-8">
            {filteredProjects.length === 0 && selectedCategory && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No projects in this category.</p>
              </div>
            )}
            {filteredProjects.map((project, index) => {
              const isImageOnLeft = index % 2 === 0;
              const projectImage = project.images?.[0]?.image_url;

              return (
                <article
                  key={project.id}
                  className="group elevated-card overflow-hidden cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                  onClick={() => handleViewMore(project)}
                >
                  <div
                    className={`grid grid-cols-1 lg:grid-cols-2 ${
                      isImageOnLeft ? '' : 'lg:grid-flow-dense'
                    }`}
                  >
                    {/* Image */}
                    <div 
                      className={`relative aspect-[16/10] lg:aspect-auto lg:min-h-[400px] overflow-hidden ${
                        !isImageOnLeft ? 'lg:col-start-2' : ''
                      }`}
                    >
                      {projectImage ? (
                        <img
                          src={projectImage}
                          alt={project.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
                          No image available
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/10 group-hover:to-background/20 transition-all duration-500" />
                    </div>

                    {/* Content */}
                    <div className={`p-8 lg:p-12 flex flex-col justify-center ${
                      !isImageOnLeft ? 'lg:col-start-1 lg:row-start-1' : ''
                    }`}>
                      <h3 className="text-2xl lg:text-3xl font-semibold mb-4 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-muted-foreground mb-8 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={project.demo_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          View Live
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMore(project);
                          }}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
};

export default ProjectShowcaseBlock;