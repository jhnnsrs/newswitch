import type { DichroicKubeStateSchema } from "@/hooks/states";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { type z } from "zod";
import { useThreeAffine } from "./useThreeAffine";

type DichroicData = z.infer<typeof DichroicKubeStateSchema>;



export const DichroicKubePlane = ({ data }: { data: DichroicData }) => {
  const matrix = useThreeAffine(data.affine_matrix);
  
  // Calculate the color based on the wavelength, defaulting to clear/gray if undefined
  const filterColor = "#e2e8f0";

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