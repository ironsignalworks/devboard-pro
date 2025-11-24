import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";

export default function Notes() {
  // Mock data
  const notes = [
    {
      title: "API Integration Checklist",
      preview: "Steps for integrating third-party APIs: 1. Review documentation 2. Set up authentication...",
      tags: ["api", "integration"],
      updatedAt: "2 hours ago",
    },
    {
      title: "Database Design Patterns",
      preview: "Common patterns for structuring relational databases including normalization and indexing strategies...",
      tags: ["database", "patterns"],
      updatedAt: "1 day ago",
    },
    {
      title: "React Best Practices",
      preview: "Key principles for writing maintainable React code: Component composition, custom hooks...",
      tags: ["react", "best-practices"],
      updatedAt: "3 days ago",
    },
    {
      title: "Security Considerations",
      preview: "Important security measures for web applications: Input validation, CSRF protection...",
      tags: ["security", "web"],
      updatedAt: "1 week ago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Notes</h1>
          <p className="text-muted-foreground">
            Document your thoughts, ideas, and learnings
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Notes List */}
      {notes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note, index) => (
            <Card 
              key={index}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
            >
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <h3 className="font-semibold text-sm line-clamp-2">{note.title}</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {note.preview}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {note.updatedAt}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Start documenting your development journey with your first note."
          actionLabel="Create Note"
          onAction={() => {}}
        />
      )}
    </div>
  );
}
