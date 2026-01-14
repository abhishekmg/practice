import * as React from "react";
import { cn } from "@/lib/utils";

export interface ScrollAreaProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function ScrollArea({ className, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700",
        className
      )}
      {...props}
    />
  );
}

