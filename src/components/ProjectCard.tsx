import { FolderKanban, Code2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ProjectCardProps {
  title: string;
  description?: string;
  snippetsCount: number;
  notesCount: number;
  progress: number;
  status: "active" | "completed" | "archived";
  onClick?: () => void;
}

export function ProjectCard({
  title,
  description,
  snippetsCount,
  notesCount,
  progress,
  status,
  onClick,
}: ProjectCardProps) {
  const statusColors = {
    active: "bg-primary",
    completed: "bg-success",
    archived: "bg-muted-foreground",
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
      onClick={onClick}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <FolderKanban className="h-5 w-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold line-clamp-1">{title}</h3>
          </div>
          <Badge 
            variant="secondary" 
            className={`${statusColors[status]} text-white text-xs`}
          >
            {status}
          </Badge>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Code2 className="h-4 w-4" />
            <span>{snippetsCount} snippets</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{notesCount} notes</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </CardContent>
    </Card>
  );
}
