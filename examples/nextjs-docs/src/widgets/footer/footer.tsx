interface FooterProps {
  dict: {
    footer: {
      madeWith: string;
      license: string;
    };
  };
}

export function Footer({ dict }: FooterProps) {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-center text-sm text-muted-foreground sm:flex-row">
        <p>{dict.footer.madeWith}</p>
        <p>{dict.footer.license}</p>
      </div>
    </footer>
  );
}
