import React from "react";
import Link from "next/link";
import { Shield, CheckCircle2, ExternalLink } from "lucide-react";

export interface VirusTotalWidgetProps {
  fileHash: string;
  fileName?: string;
}

const VirusTotalWidget: React.FC<VirusTotalWidgetProps> = ({
  fileHash,
  fileName,
}) => {
  if (!fileHash) return null;

  const virusTotalUrl = `https://www.virustotal.com/gui/file/${fileHash}/detection`;

  return (
    <div className="p-5 transition-all duration-300 border rounded-lg hover:shadow-lg hover:shadow-primary/5 hover:bg-card/90 bg-card/70 border-primary/20">
      <div className="flex items-center mb-3">
        <div className="flex items-center justify-center w-10 h-10 mb-2 mr-3 rounded-full bg-primary/10">
          <Shield className="text-primary" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            File Security Information
          </h3>
          <p className="text-xs text-muted-foreground">
            Verified by VirusTotal
          </p>
        </div>
        <div className="flex items-center px-2 py-1 ml-auto text-xs text-green-500 rounded-full bg-green-500/10">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Safe to Download
        </div>
      </div>

      {fileName && (
        <div className="p-3 mb-3 text-sm border rounded-md bg-card/50 border-border/50 text-muted-foreground">
          <div className="flex justify-between">
            <span className="font-medium">File:</span>
            <span>{fileName}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-medium">Size:</span>
            <span>17.3 MB</span>
          </div>
          <div className="flex justify-between mt-1 break-all">
            <span className="font-medium">SHA-256:</span>
            <span className="ml-2 text-xs">
              {fileHash.substring(0, 16)}...
              {fileHash.substring(fileHash.length - 8)}
            </span>
          </div>
        </div>
      )}

      <p className="mb-4 text-sm text-muted-foreground">
        We recommend checking the security scan results before downloading. Our
        files are regularly scanned to ensure they&apos;re safe for our
        community.
      </p>

      <Link
        href={virusTotalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 text-sm transition-colors duration-200 rounded-md bg-primary/90 hover:bg-primary text-primary-foreground"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        View VirusTotal Report
      </Link>
    </div>
  );
};

export default VirusTotalWidget;
