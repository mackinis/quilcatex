
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "../ui/button";
import { DialogClose } from "@radix-ui/react-dialog";

interface LegalTextModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  content: string;
}

export function LegalTextModal({ isOpen, onOpenChange, title, content }: LegalTextModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96 pr-6">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </ScrollArea>
        <div className="flex justify-end pt-2">
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                Cerrar
                </Button>
            </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
