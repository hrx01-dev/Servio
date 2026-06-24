/** Returns true when a keydown event originates from a text-entry element.
 *  Use this to skip global shortcuts while the user is typing in a form. */
export function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement;
  return (
    t.isContentEditable ||
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT"
  );
}
