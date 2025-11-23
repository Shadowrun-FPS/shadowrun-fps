"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash,
  Edit,
  Save,
  X,
} from "lucide-react";
import { AddRuleDialog } from "@/components/add-rule-dialog";
import { EditRuleDialog } from "@/components/edit-rule-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Rule } from "@/types/moderation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Mock rules data (replace with actual data from your backend)
const initialRules = [
  {
    id: "1",
    title: "No harassment or bullying",
    description:
      "Treat all members with respect. Any form of harassment, hate speech, or bullying will not be tolerated.",
  },
  {
    id: "2",
    title: "No cheating or exploiting",
    description:
      "Using cheats, hacks, or exploits to gain an unfair advantage is strictly prohibited.",
  },
  {
    id: "3",
    title: "Respect intellectual property",
    description: "Do not share or use copyrighted material without permission.",
  },
  {
    id: "4",
    title: "No spamming or excessive self-promotion",
    description:
      "Avoid flooding chats or forums with repetitive content or excessive self-promotion.",
  },
  {
    id: "5",
    title: "Keep discussions family-friendly",
    description:
      "Maintain a family-friendly environment. Avoid explicit, offensive, or inappropriate content.",
  },
];

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
  const [ruleToEdit, setRuleToEdit] = useState<Rule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/rules");

      if (!response.ok) {
        throw new Error("Failed to fetch rules");
      }

      const data = await response.json();
      setRules(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load rules",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const toggleExpand = (ruleId: string) => {
    if (expandedRule === ruleId) {
      setExpandedRule(null);
    } else {
      setExpandedRule(ruleId);
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/rules/${ruleToDelete._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete rule");
      }

      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });

      fetchRules();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete rule",
      });
    } finally {
      setIsDeleting(false);
      setRuleToDelete(null);
    }
  };

  const filteredRules = rules.filter(
    (rule) =>
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rule.description &&
        rule.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return <div className="py-8 text-center">Loading rules...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-10 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Community Rules
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage and organize community guidelines
          </p>
        </div>
        <AddRuleDialog onRuleAdded={fetchRules} />
      </div>

      <div className="relative">
        <Search className="absolute w-4 h-4 -translate-y-1/2 top-1/2 left-3 text-muted-foreground" />
        <Input
          placeholder="Search rules..."
          className="pl-10 min-h-[44px] sm:min-h-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule, index) => (
            <Card key={rule._id} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 cursor-pointer hover:bg-muted/30 touch-manipulation transition-colors"
                onClick={() => toggleExpand(rule._id)}
              >
                <h3 className="text-base sm:text-lg font-medium flex-1">
                  Rule {index + 1}: {rule.title}
                </h3>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRuleToEdit(rule);
                    }}
                    title="Edit Rule"
                    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRuleToDelete(rule);
                    }}
                    title="Delete Rule"
                    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(rule._id);
                    }}
                    title={expandedRule === rule._id ? "Collapse" : "Expand"}
                    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                  >
                    {expandedRule === rule._id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {expandedRule === rule._id && rule.description && (
                <CardContent className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6">
                  <div
                    className="prose-sm prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base"
                    dangerouslySetInnerHTML={{ __html: rule.description }}
                  />
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No rules found.{" "}
            {searchQuery
              ? "Try a different search term."
              : "Add some rules to get started."}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{ruleToDelete?.title}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRule}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {ruleToEdit && (
        <EditRuleDialog
          rule={ruleToEdit}
          open={!!ruleToEdit}
          onOpenChange={(open) => !open && setRuleToEdit(null)}
          onRuleUpdated={fetchRules}
        />
      )}
    </div>
  );
}
