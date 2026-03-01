import type { FilterKubeStateSchema } from "@/hooks/states/ExpanseState";
import { Html } from "@react-three/drei";
import { type z } from "zod";
import * as THREE from "three";
import { useThreeAffine } from "./useThreeAffine";

type FilterData = z.infer<typeof FilterKubeStateSchema>;

// Helper function to approximate a visible wavelength (380nm - 780nm) to an RGB hex color
function wavelengthToHex(wavelength: number): string {
  let r = 0, g = 0, b = 0;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  } else {
    // Fallback for non-visible wavelengths (e.g., UV or IR)
    return "#cbd5e1"; 
  }

  // Intensity modulation to fade out the edges of the visible spectrum
  let factor = 1.0;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 700 && wavelength <= 780) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * factor * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const FilterKubePlane = ({ data }: { data: FilterData }) => {
  const matrix = useThreeAffine(data.affine_matrix);
  
  // Calculate the color based on the wavelength, defaulting to clear/gray if undefined
  const filterColor = data.wavelength ? wavelengthToHex(data.wavelength) : "#e2e8f0";

  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      
      {/* Inner group rotates the filter to point down the Z-axis by default */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        
        {/* 1. Outer Filter Ring / Housing (Dark Metal) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          {/* A torus provides a smooth, rounded rim. args: [radius, tube, radialSegments, tubularSegments] */}
          <torusGeometry args={[30, 4, 16, 64]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* 2. The Transparent Glass Element */}
        <mesh>
          {/* A thin cylinder sits inside the torus to act as the glass pane */}
          <cylinderGeometry args={[29, 29, 1.5, 32]} />
          <meshStandardMaterial 
            color={filterColor} 
            metalness={0.1} 
            roughness={0.05} 
            transparent 
            opacity={0.65} 
            side={THREE.DoubleSide}
          />
        </mesh>

      </group>

      {/* Floating HTML Label */}
      <Html position={[0, 45, 0]} center distanceFactor={1.5} zIndexRange={[100, 0]}>
        <div className="flex flex-col items-center gap-1 pointer-events-none">
          <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-lg shadow-2xl backdrop-blur-md min-w-[120px]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 border-b border-slate-700 pb-1 mb-1 text-center">
              Filter Kube
            </div>
            <div className="text-[9px] font-mono text-slate-300 flex flex-col gap-0.5">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Wavelength:</span> 
                {/* Dynamically display the wavelength or a fallback */}
                <span style={{ color: filterColor }}>
                  {data.wavelength ? `${data.wavelength} nm` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-700"></div>
        </div>
      </Html>
    </group>
  );
};