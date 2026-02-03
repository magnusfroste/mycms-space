import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { DisplayProject } from '@/types/displayProject';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectModalProps {
  project: DisplayProject;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectModal = ({ project, isOpen, onClose }: ProjectModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Get images array
  const imagesToShow = project.images && project.images.length > 0
    ? project.images
    : project.image 
      ? [project.image] 
      : [];

  const hasMultipleImages = imagesToShow.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? imagesToShow.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === imagesToShow.length - 1 ? 0 : prev + 1));
  };

  // Reset index when project changes
  React.useEffect(() => {
    setCurrentIndex(0);
  }, [project.id]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Project Details
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {imagesToShow.length > 0 && (
            <div className="rounded-lg overflow-hidden p-4 bg-muted/30">
              <div className="relative">
                {/* Current Image */}
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                  <img 
                    src={imagesToShow[currentIndex]} 
                    alt={`${project.title} - Image ${currentIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Navigation Buttons */}
                {hasMultipleImages && (
                  <>
                    <Button 
                      variant="secondary" 
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-10 h-10"
                      onClick={goToPrevious}
                    >
                      <ChevronLeft className="h-6 w-6" />
                      <span className="sr-only">Previous image</span>
                    </Button>
                    <Button 
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-10 h-10"
                      onClick={goToNext}
                    >
                      <ChevronRight className="h-6 w-6" />
                      <span className="sr-only">Next image</span>
                    </Button>
                  </>
                )}
              </div>
              
              {/* Image Counter */}
              {hasMultipleImages && (
                <div className="mt-2 flex justify-center items-center gap-2">
                  <div className="text-sm text-muted-foreground font-medium bg-secondary/50 px-3 py-1 rounded-full">
                    {currentIndex + 1} / {imagesToShow.length}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          
          {project.problemStatement && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Problem</h3>
              <p className="text-muted-foreground">{project.problemStatement}</p>
            </div>
          )}
          
          {project.whyBuilt && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Why It Matters</h3>
              <p className="text-muted-foreground">{project.whyBuilt}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;
