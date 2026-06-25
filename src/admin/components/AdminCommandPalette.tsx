import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/app/components/ui/command";
import { ADMIN_NAV } from "../rbac/navigation";
import { useAdmin } from "../context/useAdmin";

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminCommandPalette({
  open,
  onOpenChange,
}: AdminCommandPaletteProps) {
  const navigate = useNavigate();
  const { can } = useAdmin();

  const navItems = ADMIN_NAV.filter((item) => can(item.permission));
  const canCreateProject = can("projects:edit");

  function run(fn: () => void) {
    onOpenChange(false);
    fn();
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Admin Search"
      description="Navigate to a page or run an action"
    >
      <CommandInput placeholder="Search pages and actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.to}
              value={item.label}
              onSelect={() => run(() => navigate(`/admin/${item.to}`))}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {canCreateProject && (
          <CommandGroup heading="Actions">
            <CommandItem
              value="new project create"
              onSelect={() =>
                run(() =>
                  navigate("/admin/projects", { state: { openNew: true } }),
                )
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Project
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
