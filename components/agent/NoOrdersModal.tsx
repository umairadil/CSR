"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneOff, RefreshCw, CheckCircle } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  message?: string;
  showRefresh?: boolean;
};

export function NoOrdersModal({ 
  open, 
  onClose, 
  onRefresh, 
  message = "No active orders available for calling",
  showRefresh = true 
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div 
            className="w-full max-w-md rounded-xl border bg-background shadow-lg" 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <PhoneOff className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">No Orders Available</CardTitle>
                <p className="text-muted-foreground mt-2">
                  {message}
                </p>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>All your assigned orders have been processed or are not in an active state.</p>
                  <p className="mt-1">Check back later or contact your supervisor for new assignments.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  {showRefresh && onRefresh && (
                    <Button 
                      variant="outline" 
                      onClick={onRefresh}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Orders
                    </Button>
                  )}
                  <Button onClick={onClose} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Got It
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}




