/**
 * Create Auth Profile Dialog
 * Shows CLI command for creating auth profiles (Dashboard cannot spawn Claude login directly)
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Terminal } from 'lucide-react';

interface CreateAuthProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateAuthProfileDialog({ open, onClose }: CreateAuthProfileDialogProps) {
  const [profileName, setProfileName] = useState('');
  const [copied, setCopied] = useState(false);

  // Validate profile name: alphanumeric, dash, underscore only
  const isValidName = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(profileName);
  const command = profileName ? `ccs auth create ${profileName}` : 'ccs auth create <name>';

  const handleCopy = async () => {
    if (!isValidName) return;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setProfileName('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <DialogDescription>
            Auth profiles require Claude CLI login. Run the command below in your terminal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input
              id="profile-name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g., work, personal, client"
              autoComplete="off"
            />
            {profileName && !isValidName && (
              <p className="text-xs text-destructive">
                Name must start with a letter and contain only letters, numbers, dashes, or
                underscores.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Command</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm">
              <Terminal className="w-4 h-4 text-muted-foreground shrink-0" />
              <code className="flex-1 break-all">{command}</code>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 px-2"
                onClick={handleCopy}
                disabled={!isValidName}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>After running the command:</p>
            <ol className="list-decimal list-inside pl-2 space-y-0.5">
              <li>Complete the Claude login in your browser</li>
              <li>Return here and refresh to see the new account</li>
            </ol>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={handleCopy} disabled={!isValidName}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Command
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
