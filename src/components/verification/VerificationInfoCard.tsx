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
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-2">Registration Details</h3>
      <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
        <p><span className="font-medium">Name:</span> {farmerData?.firstName} {farmerData?.lastName}</p>
        <p><span className="font-medium">Farm:</span> {farmerData?.farmName}</p>
        <p><span className="font-medium">Phone:</span> {farmerData?.phoneNo}</p>
        <p><span className="font-medium">Email:</span> {farmerData?.email || 'N/A'}</p>
      </div>
      <p className="text-xs text-blue-600 mt-2">
        Ensure your ID name matches "{farmerData?.firstName} {farmerData?.lastName}" (middle names OK)
      </p>
    </div>
  );
}