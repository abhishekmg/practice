'use client';

import { useState } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const GOOGLE_AI_STUDIO_URL = 'https://aistudio.google.com/apikey';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const { setGoogleApiKey, hasUserApiKey, maskedKeyHint } = useApiKey();
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) {
      setGoogleApiKey(trimmed);
      setSaved(true);
      setValue('');
    } else {
      setGoogleApiKey(null);
      setSaved(true);
    }
  };

  const handleClear = () => {
    setGoogleApiKey(null);
    setValue('');
    setSaved(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-slate-800 bg-slate-950 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Bring your own API key</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Use your own Google AI (Gemini) API key so usage is billed to your account.
            Your key is stored only in this browser and is never sent to our servers
            except to call the Google API for chat and evaluation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {hasUserApiKey && (
            <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              Using your key: {maskedKeyHint}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-zinc-300">
              Google AI (Gemini) API key
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder={hasUserApiKey ? 'Enter a new key to replace' : 'Paste your API key'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="border-slate-700 bg-slate-900 text-zinc-100 placeholder:text-zinc-500"
              autoComplete="off"
            />
            <p className="text-xs text-zinc-500">
              Get a key at{' '}
              <a
                href={GOOGLE_AI_STUDIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
          {saved && (
            <p className="text-sm text-emerald-400">Settings saved.</p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {hasUserApiKey && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="border-slate-700 text-zinc-300"
            >
              Remove key
            </Button>
          )}
          <Button
            type="button"
            onClick={() => (value.trim() ? handleSave() : onClose())}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {value.trim() ? 'Save key' : 'Done'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
