import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-yellow-400 border-r-transparent bg-transparent align-middle text-yellow-400",
        "animate-spin",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

