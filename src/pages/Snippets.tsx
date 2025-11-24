import { useState } from "react";
import { Code2, Grid3x3, List, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SnippetCard } from "@/components/SnippetCard";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Snippets() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Mock data
  const snippets = [
    {
      title: "useDebounce Hook",
      description: "Custom React hook for debouncing values with configurable delay",
      language: "TypeScript",
      tags: ["react", "hooks", "performance"],
      updatedAt: "2 hours ago",
    },
    {
      title: "API Error Handler",
      description: "Centralized error handling middleware for Express applications",
      language: "JavaScript",
      tags: ["api", "middleware", "error-handling"],
      updatedAt: "5 hours ago",
    },
    {
      title: "Form Validation Schema",
      description: "Zod schema for user registration form with password validation",
      language: "TypeScript",
      tags: ["validation", "forms", "zod"],
      updatedAt: "1 day ago",
    },
    {
      title: "Database Migration Script",
      description: "PostgreSQL migration for user roles and permissions",
      language: "SQL",
      tags: ["database", "postgresql", "migration"],
      updatedAt: "2 days ago",
    },
    {
      title: "Auth Middleware",
      description: "JWT authentication middleware with refresh token support",
      language: "TypeScript",
      tags: ["auth", "jwt", "security"],
      updatedAt: "3 days ago",
    },
    {
      title: "CSS Animation Utilities",
      description: "Reusable CSS animations for smooth transitions",
      language: "CSS",
      tags: ["css", "animations", "ui"],
      updatedAt: "1 week ago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Snippets</h1>
          <p className="text-muted-foreground">
            Manage and organize your code snippets
          </p>
        </div>
        <Button>
          <Code2 className="mr-2 h-4 w-4" />
          New Snippet
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="css">CSS</SelectItem>
              <SelectItem value="sql">SQL</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="recent">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
          <TabsList>
            <TabsTrigger value="grid">
              <Grid3x3 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Snippets Grid/List */}
      {snippets.length > 0 ? (
        <div className={viewMode === "grid" 
          ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
          : "space-y-3"
        }>
          {snippets.map((snippet, index) => (
            <SnippetCard key={index} {...snippet} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Code2}
          title="No snippets yet"
          description="Create your first code snippet to get started organizing your development knowledge."
          actionLabel="Create Snippet"
          onAction={() => {}}
        />
      )}
    </div>
  );
}
