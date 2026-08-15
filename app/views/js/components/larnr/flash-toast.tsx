import { usePage } from '@inertiajs/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface FlashProps {
    success?: string;
    error?: string;
}

export default function FlashToast() {
    const { flash } = usePage().props as { flash: FlashProps };

    if (!flash?.success && !flash?.error) return null;

    const isSuccess = Boolean(flash.success);

    return (
        <div className="toast toast-end toast-top z-50">
            <div
                className={`alert ${
                    isSuccess ? 'alert-success' : 'alert-error'
                } rounded-full border-0 shadow-2xl`}
            >
                <div className="flex items-center gap-2">
                    {isSuccess ? (
                        <CheckCircle2 className="size-5" />
                    ) : (
                        <AlertCircle className="size-5" />
                    )}
                    <span className="text-sm">
                        {isSuccess ? flash.success : String(flash.error)}
                    </span>
                </div>
            </div>
        </div>
    );
}