import { Code2, FileText, FolderKanban, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SnippetCard } from "@/components/SnippetCard";
import { ProjectCard } from "@/components/ProjectCard";

export default function Dashboard() {
  // Mock data
  const stats = [
    { title: "Total Snippets", value: "24", icon: Code2, change: "+3 this week" },
    { title: "Active Projects", value: "5", icon: FolderKanban, change: "2 in progress" },
    { title: "Notes", value: "12", icon: FileText, change: "+2 today" },
    { title: "Productivity", value: "87%", icon: TrendingUp, change: "+5% this month" },
  ];

  const recentSnippets = [
    {
      title: "useDebounce Hook",
      description: "Custom React hook for debouncing values",
      language: "TypeScript",
      tags: ["react", "hooks"],
      updatedAt: "2 hours ago",
    },
    {
      title: "API Error Handler",
      description: "Centralized error handling middleware",
      language: "JavaScript",
      tags: ["api", "middleware"],
      updatedAt: "5 hours ago",
    },
    {
      title: "Form Validation Schema",
      description: "Zod schema for user registration form",
      language: "TypeScript",
      tags: ["validation", "forms"],
      updatedAt: "1 day ago",
    },
  ];

  const activeProjects = [
    {
      title: "E-commerce Platform",
      description: "Full-stack online store with payment integration",
      snippetsCount: 8,
      notesCount: 4,
      progress: 65,
      status: "active" as const,
    },
    {
      title: "Portfolio Website",
      description: "Personal portfolio with blog and project showcase",
      snippetsCount: 5,
      notesCount: 2,
      progress: 90,
      status: "active" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your development workspace.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Snippets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Snippets</h2>
          <a href="/snippets" className="text-sm text-primary hover:underline">
            View all
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentSnippets.map((snippet, index) => (
            <SnippetCard key={index} {...snippet} />
          ))}
        </div>
      </div>

      {/* Active Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Projects</h2>
          <a href="/projects" className="text-sm text-primary hover:underline">
            View all
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {activeProjects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </div>
      </div>
    </div>
  );
}
