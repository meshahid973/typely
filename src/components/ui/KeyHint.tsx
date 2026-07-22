interface KeyHintProps {
  shortcut: string;
  label: string;
}

export function KeyHint({ shortcut, label }: KeyHintProps) {
  return (
    <span className="key-hint">
      <kbd>{shortcut}</kbd>
      <span>{label}</span>
    </span>
  );
}
