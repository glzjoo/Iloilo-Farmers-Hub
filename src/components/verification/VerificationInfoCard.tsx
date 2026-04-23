interface VerificationInfoCardProps {
  farmerData: {
    firstName: string;
    lastName: string;
    farmName: string;
    phoneNo: string;
    email?: string;
  };
}

export default function VerificationInfoCard({ farmerData }: VerificationInfoCardProps) {
  return (
    <div className="mb-6 p-4 bg-primary/10 border border-primary/40 rounded-lg">
      <h3 className="font-semibold mb-2 text-primary">Registration Details</h3>
      <div className="grid grid-cols-2 gap-2 text-sm text-primary">
        <p><span className="font-medium">Name:</span> {farmerData?.firstName} {farmerData?.lastName}</p>
        <p><span className="font-medium">Farm:</span> {farmerData?.farmName}</p>
        <p><span className="font-medium">Phone:</span> {farmerData?.phoneNo}</p>
        <p><span className="font-medium">Email:</span> {farmerData?.email || 'N/A'}</p>
      </div>
      <p className="text-xs text-gray-600 mt-5">
        Ensure your ID name matches "{farmerData?.firstName} {farmerData?.lastName}" (middle names OK)
      </p>
    </div>
  );
}