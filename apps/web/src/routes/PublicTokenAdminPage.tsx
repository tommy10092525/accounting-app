import { Button } from '@/components/ui/button';
import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom';
import linkIcon from "@/components/images/リンクアイコン.svg"

type Circle = { name: string; publicToken: string };

const PublicTokenAdminPage = () => {
  const { circle } = useOutletContext<{ circle: Circle }>();
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/#/c/${circle.publicToken}`;

  async function handleCopyShareUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-center">立て替えリンクの発行</h1>
        <div className="mt-4 flex items-center gap-2 border-2 border-brand-blue rounded-xl p-2 bg-card">
          <img src={linkIcon}/>

          <code className="flex-1 truncate px-3 py-2 text-sm">
            {shareUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyShareUrl}
          >
            {copied ? "コピーしました" : "コピー"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PublicTokenAdminPage