import { useExpanseState } from "@/hooks/states";
import { useImageStore } from "@/store/imageStore";


export const useSelectedImage = () => {

    const selectedImageId = useImageStore((s) => s.selectedImageId);
    const { data } = useExpanseState();
    const selectedImage = data?.current_images?.find((img) => img.id === selectedImageId);
    return selectedImage;
}
