type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function HouseDetailPage({ params }: PageProps) {
    const { id } = await params;

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold">รายละเอียดบ้าน</h1>

            <p className="mt-4">House ID: {id}</p>
        </main>
    );
}