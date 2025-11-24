import { Tag, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";

export default function Tags() {
  // Mock data
  const tags = [
    { name: "react", color: "bg-blue-500", count: 15 },
    { name: "typescript", color: "bg-blue-600", count: 12 },
    { name: "hooks", color: "bg-purple-500", count: 8 },
    { name: "api", color: "bg-green-500", count: 10 },
    { name: "database", color: "bg-yellow-500", count: 6 },
    { name: "auth", color: "bg-red-500", count: 7 },
    { name: "forms", color: "bg-pink-500", count: 5 },
    { name: "validation", color: "bg-orange-500", count: 4 },
    { name: "performance", color: "bg-teal-500", count: 6 },
    { name: "security", color: "bg-indigo-500", count: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Tags</h1>
          <p className="text-muted-foreground">
            Manage and organize your tags
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Tag
        </Button>
      </div>

      {/* Tags Grid */}
      {tags.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map((tag) => (
            <Card 
              key={tag.name}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${tag.color}`} />
                    <span className="font-medium">{tag.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tag.count}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Tag}
          title="No tags yet"
          description="Create tags to help organize and categorize your snippets and notes."
          actionLabel="Create Tag"
          onAction={() => {}}
        />
      )}
    </div>
  );
}
