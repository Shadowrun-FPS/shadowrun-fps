type MatchDetailsProps = {
  status: string;
  eloTier: string;
  winner?: string;
};

export default function MatchDetails({
  status,
  eloTier,
  winner,
}: MatchDetailsProps) {
  return (
    <div className="prose dark:prose-invert">
      <p>
        <strong>Status:</strong> {status}
      </p>
      <p>
        <strong>ELO Tier:</strong> {eloTier}
      </p>
      {winner && (
        <p>
          <strong>{winner} Winner!</strong>
        </p>
      )}
    </div>
  );
}
