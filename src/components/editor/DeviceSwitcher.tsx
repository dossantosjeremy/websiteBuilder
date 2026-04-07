'use client';

import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import toast from 'react-hot-toast';

interface DeviceSwitcherProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any;
  currentDevice?: string;
}

const DEVICES = [
  { name: 'Desktop', icon: Monitor },
  { name: 'Tablet', icon: Tablet },
  { name: 'Mobile', icon: Smartphone },
] as const;

export default function DeviceSwitcher({ editor, currentDevice }: DeviceSwitcherProps) {
  const handleSwitch = (deviceName: string) => {
    if (!editor) return;

    if (deviceName === 'Mobile') {
      // Check if any selected component has mobile-specific styles
      const selectedComponent = editor.getSelected();
      const hasMobileStyles = selectedComponent
        ? Object.keys(selectedComponent.getStyle({ mediaCondition: '@media (max-width: 480px)' }) ?? {}).length > 0
        : true; // no component selected — skip warning

      if (!hasMobileStyles) {
        toast('Some components may not have mobile styles. Consider checking responsive behavior.', {
          icon: '📱',
          duration: 4000,
        });
      }
    }

    editor.setDevice(deviceName);
  };

  const activeDevice = currentDevice ?? editor?.getDevice?.() ?? 'Desktop';

  return (
    <div className="flex items-center gap-1 bg-[hsl(0,0%,11%)] rounded-lg p-1">
      {DEVICES.map(({ name, icon: Icon }) => (
        <Tooltip key={name}>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'h-7 w-7 flex items-center justify-center rounded-md transition-colors',
                activeDevice === name
                  ? 'bg-[hsl(221,83%,53%)] text-white'
                  : 'text-[hsl(0,0%,55%)] hover:text-[hsl(0,0%,85%)] hover:bg-[hsl(0,0%,16%)]'
              )}
              onClick={() => handleSwitch(name)}
              title={name}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
