// src/components/certificates/CertificateTemplate.tsx
import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Circle, Line, Group, Image } from 'react-konva';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { InteractiveSubmission } from '../../types/interactiveAssignment';

interface CertificateTemplateProps {
  submission: InteractiveSubmission;
  assignmentTitle?: string;
  assignmentOrganizationId?: string;
  width?: number;
  height?: number;
  onExport?: (dataUrl: string) => void;
}

const CertificateTemplate = ({
  submission,
  assignmentTitle,
  assignmentOrganizationId,
  width = 800,
  height = 600,
  onExport
}: CertificateTemplateProps) => {
  const stageRef = useRef<any>(null);
  const { config } = useConfiguration();
  const { username, supabase } = useSupabaseAuth();
  const { currentOrganization } = useOrganization();
  const { anonymousUser } = useInteractiveAssignment();
  const [sealImage, setSealImage] = useState<HTMLImageElement | null>(null);
  const [signatureImage, setSignatureImage] = useState<HTMLImageElement | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width, height });
  const [studentName, setStudentName] = useState<string>('');
  const [assignmentOrganization, setAssignmentOrganization] = useState<any>(null);

  // Get student name from anonymous user or authenticated user
  useEffect(() => {
    const getStudentName = async () => {
      if (anonymousUser) {
        setStudentName(anonymousUser.name);
      } else if (username) {
        setStudentName(username);
      } else {
        // Try to fetch anonymous user data from submission
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('anonymous_user')
              .select('name')
              .eq('id', submission.userId)
              .single();

            if (data && !error) {
              setStudentName(data.name);
            } else {
              setStudentName('Dedicated Learner');
            }
          } catch (error) {
            console.error('Error fetching anonymous user:', error);
            setStudentName('Dedicated Learner');
          }
        } else {
          setStudentName('Dedicated Learner');
        }
      }
    };

    getStudentName();
  }, [anonymousUser, username, submission.userId]);

  // Get assignment organization data
  useEffect(() => {
    const getAssignmentOrganization = async () => {
      if (assignmentOrganizationId && supabase) {
        try {
          const { data, error } = await supabase
            .from('organization')
            .select('id, name, logo_url, primary_color, secondary_color')
            .eq('id', assignmentOrganizationId)
            .single();

          if (data && !error) {
            setAssignmentOrganization(data);
          }
        } catch (error) {
          console.error('Error fetching assignment organization:', error);
        }
      }
    };

    getAssignmentOrganization();
  }, [assignmentOrganizationId, supabase]);

  // Make certificate responsive
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector('.certificate-container');
      if (container) {
        const containerWidth = container.clientWidth;
        // If on mobile or small screen, scale down proportionally
        if (containerWidth < width) {
          const scale = containerWidth / width;
          setStageSize({
            width: containerWidth,
            height: height * scale
          });
        } else {
          setStageSize({ width, height });
        }
      }
    };

    // Initial update
    updateDimensions();

    // Update on resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [width, height]);

  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get achievement text based on score
  const getAchievementText = (score?: number | null) => {
    const actualScore = score === null || score === undefined ? 0 : score;

    if (actualScore >= 90) return "Outstanding Achievement";
    if (actualScore >= 70) return "Excellent Performance";
    if (actualScore >= 50) return "Successful Completion";
    return "Participation and Effort";
  };

  // Generate certificate ID
  const certificateId = `CERT-${submission.id.substring(0, 8).toUpperCase()}`;

  // Load seal image
  useEffect(() => {
    const image = new window.Image();
    image.src = '/assets/images/certificate-seal.png';
    image.onload = () => {
      setSealImage(image);
    };
    image.onerror = () => {
      console.log('Error loading seal image');
    };
  }, []);

  // Load signature image if organization has one
  useEffect(() => {
    if (currentOrganization?.signatureUrl) {
      // Skip external URLs that might cause CORS issues
      if (currentOrganization.signatureUrl.startsWith('http') && !currentOrganization.signatureUrl.includes(window.location.hostname)) {
        console.log('Skipping external signature to prevent CORS issues:', currentOrganization.signatureUrl);
        setSignatureImage(null);
        return;
      }

      const image = new window.Image();
      image.crossOrigin = 'anonymous'; // Enable CORS
      image.onload = () => {
        setSignatureImage(image);
      };
      image.onerror = () => {
        console.log('Error loading signature image, skipping to prevent CORS issues');
        setSignatureImage(null);
      };
      image.src = currentOrganization.signatureUrl;
    }
  }, [currentOrganization]);

  // Load organization logo if available (prioritize assignment organization)
  useEffect(() => {
    const logoUrl = assignmentOrganization?.logo_url || currentOrganization?.logoUrl;
    if (logoUrl) {
      // Skip external URLs that might cause CORS issues
      if (logoUrl.startsWith('http') && !logoUrl.includes(window.location.hostname)) {
        console.log('Skipping external logo to prevent CORS issues:', logoUrl);
        setLogoImage(null);
        return;
      }

      const image = new window.Image();
      image.crossOrigin = 'anonymous'; // Enable CORS
      image.onload = () => {
        setLogoImage(image);
      };
      image.onerror = () => {
        console.log('Error loading organization logo, skipping to prevent CORS issues');
        setLogoImage(null);
      };
      image.src = logoUrl;
    }
  }, [assignmentOrganization, currentOrganization]);

  // Export certificate as image
  useEffect(() => {
    if (stageRef.current && onExport) {
      // Add a small delay to ensure the stage is fully rendered
      const timer = setTimeout(() => {
        try {
          // Check if any external images are loaded that might cause CORS issues
          const hasExternalImages = logoImage || signatureImage || sealImage;

          if (hasExternalImages) {
            console.log('Certificate contains images, attempting export...');
          }

          // Always export at full resolution regardless of screen size
          const dataUrl = stageRef.current.toDataURL({
            pixelRatio: 2,
            width: width,
            height: height,
            x: 0,
            y: 0
          });
          console.log('Certificate image generated successfully');
          onExport(dataUrl);
        } catch (error) {
          console.error('Error generating certificate image (likely CORS issue):', error);

          // If export fails due to CORS, try without images
          try {
            console.log('Attempting to export certificate without external images...');

            // Temporarily hide images and try again
            const originalLogoImage = logoImage;
            const originalSignatureImage = signatureImage;
            const originalSealImage = sealImage;

            setLogoImage(null);
            setSignatureImage(null);
            setSealImage(null);

            // Wait a moment for the stage to update
            setTimeout(() => {
              try {
                const dataUrl = stageRef.current.toDataURL({
                  pixelRatio: 2,
                  width: width,
                  height: height,
                  x: 0,
                  y: 0
                });
                console.log('Certificate image generated successfully without external images');
                onExport(dataUrl);

                // Restore images for display
                setLogoImage(originalLogoImage);
                setSignatureImage(originalSignatureImage);
                setSealImage(originalSealImage);
              } catch (retryError) {
                console.error('Failed to export certificate even without images:', retryError);
                onExport('');

                // Restore images for display
                setLogoImage(originalLogoImage);
                setSignatureImage(originalSignatureImage);
                setSealImage(originalSealImage);
              }
            }, 100);
          } catch (fallbackError) {
            console.error('Fallback export also failed:', fallbackError);
            onExport('');
          }
        }
      }, 1500); // Increased delay to ensure all elements are loaded

      return () => clearTimeout(timer);
    }
  }, [stageRef, onExport, width, height, logoImage, signatureImage, sealImage]);

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Create rgba string
  const rgba = (hex: string, alpha: number) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="certificate-container w-full overflow-hidden">
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        ref={stageRef}
        scale={{
          x: stageSize.width / width,
          y: stageSize.height / height
        }}
      >
        <Layer>
          {/* Background with subtle gradient */}
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: width, y: height }}
            fillLinearGradientColorStops={[0, '#ffffff', 1, '#f8f9fa']}
          />

          {/* Decorative background pattern */}
          {Array.from({ length: 10 }).map((_, i) => (
            <Circle
              key={`bg-circle-${i}`}
              x={Math.random() * width}
              y={Math.random() * height}
              radius={Math.random() * 30 + 10}
              fill={rgba(config.primaryColor, 0.03)}
            />
          ))}

          {/* Border */}
          <Rect
            x={20}
            y={20}
            width={width - 40}
            height={height - 40}
            stroke={config.primaryColor}
            strokeWidth={5}
            dash={[15, 10]}
            cornerRadius={10}
          />

          {/* Inner border - adjusted for better padding */}
          <Rect
            x={50}
            y={50}
            width={width - 100}
            height={height - 100}
            stroke={config.accentColor}
            strokeWidth={2}
            cornerRadius={5}
          />

          {/* Organization Logo */}
          {logoImage && (
            <Group x={width / 2} y={60}>
              <Image
                image={logoImage}
                width={80}
                height={80}
                offsetX={40}
                offsetY={40}
              />
            </Group>
          )}

          {/* Organization Name */}
          <Text
            x={width / 2}
            y={logoImage ? 110 : 70}
            text={assignmentOrganization?.name || currentOrganization?.name || "Interactive Learning"}
            fontSize={24}
            fontStyle="bold"
            fill={config.secondaryColor}
            align="center"
            width={width}
            offsetX={width / 2}
            fontFamily="Arial, sans-serif"
          />

          {/* Certificate Header with shadow effect - Repositioned for better visibility */}
          <Text
            x={width / 2}
            y={logoImage ? 160 : 120}
            text="Certificate of Achievement"
            fontSize={38}
            fontStyle="bold"
            fill={config.primaryColor}
            align="center"
            width={width}
            offsetX={width / 2}
            shadowColor={rgba(config.primaryColor, 0.2)}
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
            fontFamily="Arial, sans-serif"
          />

          {/* Achievement Type with decorative elements - Moved below the title with proper spacing */}
          <Group y={logoImage ? 90 : 60}>
            <Line
              points={[width / 2 - 120, 125, width / 2 - 20, 125]}
              stroke={rgba(config.secondaryColor, 0.5)}
              strokeWidth={1}
            />

            <Text
              x={width / 2}
              y={125}
              text={getAchievementText(submission.score)}
              fontSize={22}
              fontStyle="italic"
              fill={config.secondaryColor}
              align="center"
              width={width}
              offsetX={width / 2}
              fontFamily="Georgia, serif"
            />

            <Line
              points={[width / 2 + 20, 125, width / 2 + 120, 125]}
              stroke={rgba(config.secondaryColor, 0.5)}
              strokeWidth={1}
            />
          </Group>

          {/* Decorative line with gradient - Further adjusted position */}
          <Rect
            x={width / 2 - 150}
            y={logoImage ? 225 : 195}
            width={300}
            height={3}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 300, y: 0 }}
            fillLinearGradientColorStops={[
              0, rgba(config.accentColor, 0.1),
              0.5, config.accentColor,
              1, rgba(config.accentColor, 0.1)
            ]}
            cornerRadius={1.5}
          />

          {/* Certificate Body - Further increased spacing */}
          <Text
            x={width / 2}
            y={logoImage ? 255 : 225}
            text="This certificate is proudly presented to"
            fontSize={18}
            align="center"
            width={width}
            offsetX={width / 2}
            fontFamily="Georgia, serif"
          />

          <Text
            x={width / 2}
            y={currentOrganization?.logoUrl ? 295 : 265}
            text={studentName || 'Dedicated Learner'}
            fontSize={30}
            fontStyle="bold"
            fill={config.secondaryColor}
            align="center"
            width={width}
            offsetX={width / 2}
            fontFamily="Arial, sans-serif"
            shadowColor={rgba(config.secondaryColor, 0.2)}
            shadowBlur={3}
            shadowOffset={{ x: 1, y: 1 }}
          />

          {/* Decorative underline for name */}
          <Line
            points={[width / 2 - 150, currentOrganization?.logoUrl ? 315 : 285, width / 2 + 150, currentOrganization?.logoUrl ? 315 : 285]}
            stroke={rgba(config.secondaryColor, 0.3)}
            strokeWidth={1}
            dash={[1, 2]}
          />

          <Text
            x={width / 2}
            y={currentOrganization?.logoUrl ? 345 : 315}
            text="for successfully completing"
            fontSize={18}
            align="center"
            width={width}
            offsetX={width / 2}
            fontFamily="Georgia, serif"
          />

          <Text
            x={width / 2}
            y={currentOrganization?.logoUrl ? 385 : 355}
            text={assignmentTitle || 'Interactive Assignment'}
            fontSize={26}
            fontStyle="bold"
            fill={config.accentColor}
            align="center"
            width={width}
            offsetX={width / 2}
            fontFamily="Arial, sans-serif"
            shadowColor={rgba(config.accentColor, 0.2)}
            shadowBlur={3}
            shadowOffset={{ x: 1, y: 1 }}
          />

          {/* Assignment details in a decorative box - Further adjusted position */}
          <Group y={currentOrganization?.logoUrl ? 70 : 40}>
            <Rect
              x={width / 2 - 150}
              y={345}
              width={300}
              height={60}
              fill={rgba(config.primaryColor, 0.05)}
              stroke={rgba(config.primaryColor, 0.2)}
              strokeWidth={1}
              cornerRadius={5}
            />

            <Text
              x={width / 2}
              y={360}
              text={`Assignment Type: ${'Interactive Exercise'}`}
              fontSize={16}
              align="center"
              width={width}
              offsetX={width / 2}
              fontFamily="Georgia, serif"
            />

            <Text
              x={width / 2}
              y={385}
              text={`Difficulty Level: ${'Standard'}`}
              fontSize={16}
              align="center"
              width={width}
              offsetX={width / 2}
              fontFamily="Georgia, serif"
            />
          </Group>

          {/* Organization Type - Adjusted position */}
          {currentOrganization?.type && (
            <Group x={width / 2} y={logoImage ? 470 : 440}>
              <Text
                text={`Issued by: ${currentOrganization.type.charAt(0).toUpperCase() + currentOrganization.type.slice(1)}`}
                fontSize={16}
                fontStyle="italic"
                fill={config.secondaryColor}
                align="center"
                width={width}
                offsetX={width / 2}
                fontFamily="Georgia, serif"
              />
            </Group>
          )}

          {/* Score section with improved layout - Repositioned with better spacing */}
          <Group y={logoImage ? 40 : 20}>
            {/* Score label and value in a horizontal layout */}
            <Group x={width / 2 - 150} y={490}>
              <Text
                text="With a score of:"
                fontSize={20}
                fontStyle="italic"
                fill={config.secondaryColor}
                align="right"
                width={150}
                fontFamily="Georgia, serif"
              />
            </Group>

            {/* Score Circle with decorative elements */}
            <Group x={width / 2 + 80} y={490}>
              {/* Outer decorative circle */}
              <Circle
                radius={45}
                stroke={rgba(config.primaryColor, 0.3)}
                strokeWidth={2}
                dash={[2, 2]}
              />

              {/* Main score circle */}
              <Circle
                radius={40}
                fill={submission.score && submission.score > 0 ? config.primaryColor : config.secondaryColor}
                shadowColor="rgba(0,0,0,0.2)"
                shadowBlur={10}
                shadowOffset={{ x: 3, y: 3 }}
              />

              {/* Centered percentage text */}
              <Text
                text={`${submission.score !== undefined && submission.score !== null ? submission.score : 0}%`}
                fontSize={26}
                fontStyle="bold"
                fill="white"
                align="center"
                width={80}
                offsetX={40}
                offsetY={13}
                fontFamily="Arial, sans-serif"
              />
            </Group>

            {/* Decorative line connecting the elements */}
            <Line
              points={[width / 2 - 140, 510, width / 2 + 140, 510]}
              stroke={rgba(config.accentColor, 0.2)}
              strokeWidth={1}
              dash={[3, 3]}
            />
          </Group>

          {/* Certificate Footer - Properly spaced and positioned */}
          <Group x={120} y={height - 120}>
            <Line
              points={[0, 0, 120, 0]}
              stroke={rgba(config.primaryColor, 0.5)}
              strokeWidth={1}
            />
            <Text
              y={15}
              text={`Date: ${formatDate(submission.submittedAt)}`}
              fontSize={14}
              fill="#555"
              fontFamily="Georgia, serif"
            />
            {currentOrganization?.headerText && (
              <Text
                y={35}
                text={currentOrganization.headerText}
                fontSize={12}
                fill="#777"
                fontFamily="Georgia, serif"
                fontStyle="italic"
              />
            )}
          </Group>

          {/* Certificate ID with improved seal - Better positioned */}
          <Group x={width / 2} y={height - 120}>
            {sealImage && (
              <Group>
                {/* Background glow for seal */}
                <Circle
                  radius={30}
                  fill={rgba(config.primaryColor, 0.1)}
                  x={0}
                  y={-30}
                />
                <Image
                  image={sealImage}
                  width={50}
                  height={50}
                  offsetX={25}
                  offsetY={-30}
                  opacity={0.9}
                />
              </Group>
            )}
            <Text
              y={15}
              text={`Certificate ID: ${certificateId}`}
              fontSize={14}
              fill="#555"
              align="center"
              width={200}
              offsetX={100}
              fontFamily="Georgia, serif"
            />
          </Group>

          {/* Organization signature - Repositioned with signature above text */}
          <Group x={width - 180} y={height - 120}>
            <Line
              points={[-80, 0, 0, 0]}
              stroke={rgba(config.primaryColor, 0.5)}
              strokeWidth={1}
            />
            {signatureImage ? (
              <Group>
                {/* Signature image positioned above the text */}
                <Image
                  image={signatureImage}
                  width={100}
                  height={40}
                  offsetX={50}
                  offsetY={-40}
                  opacity={0.9}
                />
                {/* Text positioned below the signature */}
                <Text
                  y={15}
                  text={currentOrganization?.name || "Instructor Signature"}
                  fontSize={13}
                  fill="#555"
                  align="right"
                  width={120}
                  fontFamily="Georgia, serif"
                />
              </Group>
            ) : (
              <Group>
                {/* Simulated signature positioned above the text */}
                <Text
                  y={-40}
                  text="✓ Verified"
                  fontSize={18}
                  fontStyle="italic"
                  fill={config.primaryColor}
                  align="right"
                  width={120}
                  fontFamily="Brush Script MT, cursive"
                />
                {/* Organization name */}
                <Text
                  y={-15}
                  text={currentOrganization?.name || "Organization"}
                  fontSize={14}
                  fontStyle="bold"
                  fill="#555"
                  align="right"
                  width={120}
                  fontFamily="Georgia, serif"
                />
                {/* Signature text */}
                <Text
                  y={15}
                  text="Instructor Signature"
                  fontSize={13}
                  fill="#555"
                  align="right"
                  width={120}
                  fontFamily="Georgia, serif"
                />
              </Group>
            )}
          </Group>

          {/* Enhanced decorative corners - adjusted to match inner border */}
          <Group>
            {/* Top left */}
            <Group>
              <Line
                points={[50, 50, 50, 100, 100, 50]}
                stroke={rgba(config.accentColor, 0.4)}
                strokeWidth={3}
              />
              <Circle
                x={50}
                y={50}
                radius={5}
                fill={rgba(config.primaryColor, 0.5)}
              />
            </Group>

            {/* Top right */}
            <Group>
              <Line
                points={[width - 50, 50, width - 50, 100, width - 100, 50]}
                stroke={rgba(config.accentColor, 0.4)}
                strokeWidth={3}
              />
              <Circle
                x={width - 50}
                y={50}
                radius={5}
                fill={rgba(config.primaryColor, 0.5)}
              />
            </Group>

            {/* Bottom left */}
            <Group>
              <Line
                points={[50, height - 50, 50, height - 100, 100, height - 50]}
                stroke={rgba(config.accentColor, 0.4)}
                strokeWidth={3}
              />
              <Circle
                x={50}
                y={height - 50}
                radius={5}
                fill={rgba(config.primaryColor, 0.5)}
              />
            </Group>

            {/* Bottom right */}
            <Group>
              <Line
                points={[width - 50, height - 50, width - 50, height - 100, width - 100, height - 50]}
                stroke={rgba(config.accentColor, 0.4)}
                strokeWidth={3}
              />
              <Circle
                x={width - 50}
                y={height - 50}
                radius={5}
                fill={rgba(config.primaryColor, 0.5)}
              />
            </Group>
          </Group>
        </Layer>
      </Stage>
    </div>
  );
};

export default CertificateTemplate;
