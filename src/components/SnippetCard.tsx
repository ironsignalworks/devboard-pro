import { Code2, Calendar, Tag as TagIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SnippetCardProps {
  title: string;
  description?: string;
  language: string;
  tags: string[];
  updatedAt: string;
  onClick?: () => void;
}

export function SnippetCard({
  title,
  description,
  language,
  tags,
  updatedAt,
  onClick,
}: SnippetCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
      onClick={onClick}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Code2 className="h-4 w-4 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {language}
          </Badge>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{updatedAt}</span>
          </div>
          {tags.length > 0 && (
            <div className="flex items-center gap-1">
              <TagIcon className="h-3 w-3" />
              <span>{tags.length} tags</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
