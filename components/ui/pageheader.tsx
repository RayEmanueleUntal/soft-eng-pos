"use client";

interface PageHeaderProps {
  header: string;
  subheader: string;
}

export function PageHeader({ header, subheader }: PageHeaderProps) {
  return (
    <div>
      <div>
        <h1 className="headline-xl"> {header} </h1>
        <p className="text-muted-foreground text-sm mt-1">{subheader}</p>
      </div>
    </div>
  );
}
