import Image from "next/image";
// NOTE: Assuming CardContainer is correctly imported and exists
import CardContainer from "./ui/cardContainer";
import RootLayout from "./layout";

export default function Home() {
  return (
    // 'grow' ensures this content fills the space within the Course Panel
    <div className="flex flex-col grow  justify-center font-sans p-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 w-full text-left">My Course</h2>
        <CardContainer />
    </div>
  );
}

