import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function Projects() {
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "archived">("all");

  // Mock data
  const projects = [
    {
      title: "E-commerce Platform",
      description: "Full-stack online store with payment integration and inventory management",
      snippetsCount: 8,
      notesCount: 4,
      progress: 65,
      status: "active" as const,
    },
    {
      title: "Portfolio Website",
      description: "Personal portfolio with blog and project showcase using Next.js",
      snippetsCount: 5,
      notesCount: 2,
      progress: 90,
      status: "active" as const,
    },
    {
      title: "Task Management App",
      description: "Kanban-style task manager with team collaboration features",
      snippetsCount: 12,
      notesCount: 6,
      progress: 100,
      status: "completed" as const,
    },
    {
      title: "Weather Dashboard",
      description: "Real-time weather data visualization with forecasting",
      snippetsCount: 4,
      notesCount: 1,
      progress: 45,
      status: "active" as const,
    },
    {
      title: "Social Media Clone",
      description: "Twitter-like social platform with authentication and real-time updates",
      snippetsCount: 15,
      notesCount: 8,
      progress: 100,
      status: "completed" as const,
    },
  ];

  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(p => p.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Organize snippets and notes into projects
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={filter === "all" ? "No projects yet" : `No ${filter} projects`}
          description={
            filter === "all"
              ? "Create your first project to start organizing your work."
              : `You don't have any ${filter} projects at the moment.`
          }
          actionLabel={filter === "all" ? "Create Project" : undefined}
          onAction={filter === "all" ? () => {} : undefined}
        />
      )}
    </div>
  );
}
