/**
 * Single source of truth for CMS field definitions.
 * Used by API validation and the admin content editor.
 * Every public heading and line of copy is a labeled field so style/color stay in CSS.
 */

function cardFields(prefix, items) {
  const fields = [];
  items.forEach((item, i) => {
    const title = typeof item === 'string' ? item : item.title;
    const description = typeof item === 'string' ? '' : item.description || '';
    fields.push(
      { key: `${prefix}.${i}.title`, label: `${title} — heading`, type: 'text', default: title },
      { key: `${prefix}.${i}.description`, label: `${title} — text`, type: 'textarea', default: description }
    );
    if (item && typeof item === 'object' && item.icon) {
      const icon = typeof item.icon === 'string' ? { name: item.icon } : item.icon;
      fields.push({
        key: `${prefix}.${i}.icon`,
        label: `${title} — icon`,
        type: 'icon',
        default: {
          src: '',
          name: icon.name || '',
          color: icon.color || '',
        },
      });
    }
  });
  return fields;
}

function statFields(prefix, items) {
  const fields = [];
  items.forEach((item, i) => {
    fields.push(
      { key: `${prefix}.${i}.value`, label: `${item.label} — value`, type: 'text', default: item.value },
      { key: `${prefix}.${i}.label`, label: `${item.label} — heading`, type: 'text', default: item.label }
    );
  });
  return fields;
}

function linkFields(prefix, items) {
  const fields = [];
  items.forEach((item, i) => {
    fields.push(
      { key: `${prefix}.${i}.label`, label: `${item.label} — label`, type: 'text', default: item.label },
      { key: `${prefix}.${i}.href`, label: `${item.label} — link`, type: 'text', default: item.href }
    );
  });
  return fields;
}

function namedLines(prefix, items) {
  const fields = [];
  items.forEach((item, i) => {
    fields.push(
      { key: `${prefix}.${i}.name`, label: `${item.name} — heading`, type: 'text', default: item.name },
      { key: `${prefix}.${i}.text`, label: `${item.name} — text`, type: 'textarea', default: item.text }
    );
  });
  return fields;
}

function sectionHeader(prefix, sectionName, defaults = {}) {
  const fields = [];
  if (defaults.eyebrow !== undefined) {
    fields.push({ key: `${prefix}.eyebrow`, label: 'Eyebrow', type: 'text', default: defaults.eyebrow });
  }
  if (defaults.title !== undefined) {
    fields.push({ key: `${prefix}.title`, label: 'Heading', type: 'text', default: defaults.title });
  }
  if (defaults.description !== undefined) {
    fields.push({
      key: `${prefix}.description`,
      label: 'Description',
      type: 'textarea',
      default: defaults.description,
    });
  }
  return { section: sectionName, fields };
}

export const CMS_SCHEMA = {
  home: [
    {
      section: 'Header navigation',
      fields: [
        ...linkFields('header.nav', [
          { label: 'Home', href: '#home' },
          { label: 'Our Solution', href: '#solution' },
          { label: 'Workflow', href: '#how-it-works' },
          { label: 'Demo Videos', href: '#demos' },
        ]),
        { key: 'header.cta.label', label: 'Nav demo button label', type: 'text', default: 'Get Your Demo Today' },
        { key: 'header.cta.href', label: 'Nav demo button link', type: 'text', default: 'contactus.html' },
        { key: 'header.mobileTitle', label: 'Mobile menu heading', type: 'text', default: 'Menu' },
      ],
    },
    {
      section: 'Hero',
      fields: [
        { key: 'hero.eyebrow', label: 'Eyebrow', type: 'text', default: 'Design Automation Platform' },
        { key: 'hero.title.line1', label: 'Headline line 1', type: 'text', default: 'Speed & Precision' },
        { key: 'hero.title.line2', label: 'Headline line 2', type: 'text', default: '10× Amplified' },
        {
          key: 'hero.description',
          label: 'Description',
          type: 'textarea',
          default:
            'Engineered for high-volume manufacturing through automated placement zones, color blocks, and decoration-specific instructions. Standardize complex text contours with optical-fit precision to generate hundreds of variants complete with precise factory application specs from a single template in minutes.',
        },
        { key: 'hero.cta.primary.label', label: 'Primary CTA label', type: 'text', default: 'Request a Demo Today' },
        { key: 'hero.cta.primary.href', label: 'Primary CTA link', type: 'text', default: 'contactus.html' },
        { key: 'hero.cta.secondary.label', label: 'Secondary CTA label', type: 'text', default: 'Watch Explainer' },
        { key: 'hero.cta.secondary.href', label: 'Secondary CTA link', type: 'text', default: '#demos' },
        {
          key: 'hero.image',
          label: 'Hero image',
          type: 'image',
          default: { src: '/images/EasyVariants application.jpg.jpeg', alt: 'EasyVariants application interface' },
        },
        { key: 'hero.stats.0.value', label: 'Hero stat 1 value', type: 'text', default: '10×' },
        { key: 'hero.stats.0.label', label: 'Hero stat 1 heading', type: 'text', default: 'Faster output' },
        { key: 'hero.stats.0.icon', label: 'Hero stat 1 icon', type: 'icon', default: { src: '', name: 'layers', color: '#3525cd' } },
        { key: 'hero.stats.1.value', label: 'Hero stat 2 value', type: 'text', default: '1K+' },
        { key: 'hero.stats.1.label', label: 'Hero stat 2 heading', type: 'text', default: 'SKUs per run' },
        { key: 'hero.stats.1.icon', label: 'Hero stat 2 icon', type: 'icon', default: { src: '', name: 'inventory_2', color: '#4f46e5' } },
        { key: 'hero.stats.2.value', label: 'Hero stat 3 value', type: 'text', default: 'Illustrator' },
        { key: 'hero.stats.2.label', label: 'Hero stat 3 heading', type: 'text', default: 'Native plugin' },
        { key: 'hero.stats.2.icon', label: 'Hero stat 3 icon', type: 'icon', default: { src: '', name: 'draw', color: '#16a34a' } },
      ],
    },
    sectionHeader('meet', 'Meet EasyVariants', {
      eyebrow: 'Explore',
      title: 'Meet EasyVariants',
      description:
        'Designed for enterprise production teams handling complex assortments. Orchestrate colorways, logo systems, and placement rules at scale without manual rework.',
    }),
    {
      section: 'Meet EasyVariants · Media',
      fields: [
        {
          key: 'meet.video',
          label: 'Explainer video (MP4 path or URL)',
          type: 'video',
          default: {
            src: '/images/YTDown_YouTube_EasyVariants-Explainer-Video_Media_2Zl_BkN9L6w_002_720p.mp4',
          },
        },
      ],
    },
    sectionHeader('problem', 'The Problem', {
      eyebrow: 'The Problem',
      title: 'The Design Bottleneck',
      description:
        "Manual variant creation isn't just time-consuming  it's a bottleneck that drains your team's creativity and slows your market speed.",
    }),
    {
      section: 'The Problem · Cards',
      fields: cardFields('problem.cards', [
        {
          title: 'Repetitive Work',
          description:
            'Duplicating assets across hundreds of styles, regions, and channels. Production teams lose hours on repetitive execution work.',
          icon: { name: 'cycle', color: '#ef4444' },
        },
        {
          title: 'Consistency Challenges',
          description:
            'Maintaining brand consistency across factories and production lines is difficult when variants are created manually.',
          icon: { name: 'rule', color: '#ef4444' },
        },
        {
          title: 'Slow Time-to-Market',
          description:
            'Manual operations delay line launches and replenishment cycles when manufacturing calendars are already compressed.',
          icon: { name: 'hourglass_empty', color: '#ef4444' },
        },
        {
          title: 'Limited Personalization',
          description:
            'Variant expansion becomes expensive and risky when every SKU requires individual manual intervention.',
          icon: { name: 'block', color: '#ef4444' },
        },
      ]),
    },
    sectionHeader('advantage', 'The EasyVariants Advantage', {
      eyebrow: 'The EasyVariants Advantage',
      title: '10X Speed, Guarantee Brand Consistency',
      description:
        'Generate hundreds, even thousands, of error-free design variants in minutes  not hours or days. Fuel your innovation.',
    }),
    {
      section: 'Advantage · Cards',
      fields: cardFields('advantage.cards', [
        {
          title: 'Boost Output 10X',
          description: 'Free your designers from repetitive drudgery, allowing them to focus on pure innovation.',
          icon: { name: 'rocket_launch', color: '#ffffff' },
        },
        {
          title: 'Guaranteed Consistency',
          description: 'Eliminate human error and ensure every variant perfectly aligns with your brand standards.',
          icon: { name: 'verified', color: '#ffffff' },
        },
        {
          title: 'Faster Time-to-Market',
          description: 'Rapidly customize and deploy new collections, gaining a critical competitive edge.',
          icon: { name: 'trending_up', color: '#ffffff' },
        },
        {
          title: 'Scalable Personalization',
          description: 'Offer extensive personalization without fear of an unmanageable design workload.',
          icon: { name: 'tune', color: '#ffffff' },
        },
      ]),
    },
    sectionHeader('inside', 'Inside EasyVariants', {
      eyebrow: 'Inside EasyVariants',
      title: 'Generate Team Variants Faster Inside Illustrator',
      description:
        'EasyVariants helps designers automate team-based product variants using smart placement zones, color blocks, dynamic text variables, and centralized team assets  all directly inside Adobe Illustrator.',
    }),
    {
      section: 'Inside EasyVariants · Features & CTA',
      fields: [
        { key: 'inside.features.0', label: 'Feature 1', type: 'text', default: 'Placement Zones' },
        { key: 'inside.features.1', label: 'Feature 2', type: 'text', default: 'Color Blocks' },
        { key: 'inside.features.2', label: 'Feature 3', type: 'text', default: 'Team Asset Mapping' },
        { key: 'inside.features.3', label: 'Feature 4', type: 'text', default: 'Embroidery Support' },
        { key: 'inside.features.4', label: 'Feature 5', type: 'text', default: 'Template Versioning' },
        { key: 'inside.features.5', label: 'Feature 6', type: 'text', default: 'Variant Generation' },
        { key: 'inside.cta.label', label: 'CTA button label', type: 'text', default: 'Explore Workflow' },
        { key: 'inside.cta.href', label: 'CTA button link', type: 'text', default: '#how-it-works' },
        {
          key: 'inside.image.main',
          label: 'Main image',
          type: 'image',
          default: { src: '/images/EasyVariants.jpg.jpeg', alt: 'EasyVariants Plugin Interface' },
        },
        {
          key: 'inside.image.overlap',
          label: 'Overlap image (desktop)',
          type: 'image',
          default: { src: '/images/EasyVariants application.jpg.jpeg', alt: 'EasyVariants Application' },
        },
      ],
    },
    sectionHeader('solution', 'Our Solution', {
      eyebrow: 'Our Solution',
      title: 'Smart Automation System',
      description:
        'One Illustrator template powers unlimited variants. Define rules once, map your data, and ship production-ready outputs at scale.',
    }),
    {
      section: 'Our Solution · Stats',
      fields: statFields('solution.stats', [
        { value: '10,000+', label: 'Variants' },
        { value: 'Seconds', label: 'Generation' },
        { value: '1-Click', label: 'Export' },
      ]),
    },
    {
      section: 'Our Solution · Feature cards',
      fields: [
        ...cardFields('solution.cards', [
          {
            title: 'Variable Control',
            description:
              'Define text, colors, and images once. Reuse everywhere instantly with smart templates and dynamic layers that scale without limits.',
            icon: { name: 'tune', color: '#ffffff' },
          },
          {
            title: 'Intelligent Generation',
            description:
              'Automatically create hundreds of design variations in seconds with an AI-powered layout engine built for production teams.',
            icon: { name: 'auto_awesome', color: '#3525cd' },
          },
          {
            title: 'Layer Management',
            description:
              'Organize static and dynamic elements with precision control. Full layer hierarchy and placement rules at your fingertips.',
            icon: { name: 'layers', color: '#3525cd' },
          },
          {
            title: 'Export Anywhere',
            description:
              'Download assets in multiple formats, ready for any platform. Production-ready outputs in a single click.',
            icon: { name: 'ios_share', color: '#ffffff' },
          },
        ]),
        { key: 'solution.formats.0', label: 'Export format 1', type: 'text', default: 'PNG' },
        { key: 'solution.formats.1', label: 'Export format 2', type: 'text', default: 'PDF' },
        { key: 'solution.formats.2', label: 'Export format 3', type: 'text', default: 'ZIP' },
      ],
    },
    sectionHeader('workflow', 'Workflow', {
      eyebrow: 'Workflow',
      title: 'Automate in 5 Steps',
      description: 'Streamlined workflow that turns raw inputs into hundreds of production-ready variants.',
    }),
    {
      section: 'Workflow · Steps',
      fields: [
        ...[1, 2, 3, 4, 5].flatMap((n, i) => [
          { key: `workflow.steps.${i}.number`, label: `Step ${n} number`, type: 'text', default: `Step ${n}` },
        ]),
        ...cardFields('workflow.steps', [
          {
            title: 'Upload PLM Colorways',
            description:
              'Bring in approved colorway data from your PLM and set the foundation for automated outputs.',
            icon: { name: 'palette', color: '#3525cd' },
          },
          {
            title: 'Load Ai Template',
            description: 'Load your Illustrator template so structure and artwork layers are ready for mapping.',
            icon: { name: 'upload_file', color: '#3525cd' },
          },
          {
            title: 'Define Variables',
            description:
              'Define variable inputs like colors, names, codes, and artwork references for each variant.',
            icon: { name: 'data_object', color: '#3525cd' },
          },
          {
            title: 'Map Elements',
            description:
              'Map template elements to variable data so every layer updates accurately across outputs.',
            icon: { name: 'rule_settings', color: '#3525cd' },
          },
          {
            title: 'Generate Variants',
            description: 'Run generation to produce final, production-ready variants at scale in minutes.',
            icon: { name: 'auto_awesome_motion', color: '#3525cd' },
          },
        ]),
        { key: 'workflow.moreDetails', label: 'More details button', type: 'text', default: 'More details' },
      ],
    },
    sectionHeader('deepdive.variables', 'Building Blocks', {
      eyebrow: 'Platform',
      title: 'The Variable System — Building Blocks',
    }),
    {
      section: 'Building Blocks · Intro',
      fields: [
        {
          key: 'deepdive.variables.intro',
          label: 'Intro',
          type: 'textarea',
          default:
            'Designers already think "the front logo goes here" and "the crown is the primary color." EasyVariants gives those existing concepts a home in the interface — rather than forcing a new abstraction on them. Variable types cover everything that changes from team to team; treatments such as effects run across all of them.',
        },
        { key: 'deepdive.variables.tabs.0', label: 'Tab 1 label', type: 'text', default: 'Placement Zones' },
        { key: 'deepdive.variables.tabs.0.icon', label: 'Tab 1 icon', type: 'icon', default: { src: '', name: 'place', color: '' } },
        { key: 'deepdive.variables.tabs.1', label: 'Tab 2 label', type: 'text', default: 'Color Blocks' },
        { key: 'deepdive.variables.tabs.1.icon', label: 'Tab 2 icon', type: 'icon', default: { src: '', name: 'palette', color: '' } },
        { key: 'deepdive.variables.tabs.2', label: 'Tab 3 label', type: 'text', default: 'Embroidery Zones' },
        { key: 'deepdive.variables.tabs.2.icon', label: 'Tab 3 icon', type: 'icon', default: { src: '', name: 'draw', color: '' } },
        { key: 'deepdive.variables.tabs.3', label: 'Tab 4 label', type: 'text', default: 'Dimensions' },
        { key: 'deepdive.variables.tabs.3.icon', label: 'Tab 4 icon', type: 'icon', default: { src: '', name: 'straighten', color: '' } },
        { key: 'deepdive.variables.tabs.4', label: 'Tab 5 label', type: 'text', default: 'Text' },
        { key: 'deepdive.variables.tabs.4.icon', label: 'Tab 5 icon', type: 'icon', default: { src: '', name: 'text_fields', color: '' } },
        { key: 'deepdive.variables.tabs.5', label: 'Tab 6 label', type: 'text', default: 'Treatments & Effects' },
        { key: 'deepdive.variables.tabs.5.icon', label: 'Tab 6 icon', type: 'icon', default: { src: '', name: 'auto_fix_high', color: '' } },
      ],
    },
    {
      section: 'Building Blocks · Placement Zones',
      fields: [
        {
          key: 'deepdive.variables.0.title',
          label: 'Heading',
          type: 'text',
          default: 'Placement Zones — Where art lands',
        },
        {
          key: 'deepdive.variables.0.description',
          label: 'Description',
          type: 'textarea',
          default:
            'A Placement Zone doesn\'t record coordinates. It records intent. You tell the template "the primary logo belongs here, treated this way," and every team\'s art arrives correctly sized and positioned — even though no two teams\' logos share the same shape, ratio or dimensions.',
        },
        {
          key: 'deepdive.variables.0.subhead',
          label: 'Subheading',
          type: 'text',
          default: 'Because art behaves differently depending on where it sits, the zone declares how it should land:',
        },
        ...namedLines('deepdive.variables.0.items', [
          {
            name: 'Standard Size',
            text: 'Art places at its own true dimensions, straight from the library. The spec is authoritative; the zone doesn\'t touch it.',
          },
          {
            name: 'Fitted',
            text: 'Art scales to the bounds of the zone. Use it where the space rules, not the asset.',
          },
          {
            name: 'Enveloped',
            text: 'Art warps to a contoured surface rather than sitting flat on it — a curved panel, a shaped seam, a sleeve.',
          },
          {
            name: 'Proxy',
            text: 'A stand-in that holds the position while the real asset is still in approval. The layout is finished before the art is.',
          },
          {
            name: 'LineArt',
            text: 'The line-drawing rendition of the placement, for the tech-pack views that need outline rather than render.',
          },
        ]),
        {
          key: 'deepdive.variables.0.why',
          label: 'Why it matters',
          type: 'textarea',
          default: 'Why it matters: The zone is the contract. It survives every asset that lands in it.',
        },
      ],
    },
    {
      section: 'Building Blocks · Color Blocks',
      fields: [
        {
          key: 'deepdive.variables.1.title',
          label: 'Heading',
          type: 'text',
          default: 'Color Blocks — Every fill that changes by team',
        },
        {
          key: 'deepdive.variables.1.description',
          label: 'Description',
          type: 'textarea',
          default:
            'A Color Block is any area of a design whose color is determined by the team, not the artwork itself. Instead of assigning a fixed color, you link the block to a team attribute, such as Primary Color, Secondary Color, or Accent Color. When the team colors change, every linked Color Block updates automatically across the entire program.',
        },
        {
          key: 'deepdive.variables.1.p2',
          label: 'Second paragraph',
          type: 'textarea',
          default:
            'The key idea is that a Color Block doesn\'t store a color value, it stores a reference. Its role is simply to identify what the area represents ("this is the Secondary Color"), while the team data supplies the actual color value. It can include the exact production values required for printing, embroidery, or thread matching—not just an on-screen color approximation.',
        },
        {
          key: 'deepdive.variables.1.why',
          label: 'Why it matters',
          type: 'textarea',
          default:
            'Why it matters: Recoloring is one of the most common sources of manual errors. A missed swatch looks fine on screen but result in incorrect production output. Because Color Blocks are linked to team data, updates happen automatically, making those mistakes far less likely and ensuring consistency across every design variation.',
        },
      ],
    },
    {
      section: 'Building Blocks · Embroidery Zones',
      fields: [
        {
          key: 'deepdive.variables.2.title',
          label: 'Heading',
          type: 'text',
          default: 'Embroidery Zones — Where production data comes through',
        },
        {
          key: 'deepdive.variables.2.description',
          label: 'Description',
          type: 'textarea',
          default:
            'The Embroidery Zone is the bridge between artwork and manufacturing. It carries the exact color chip, the swatch name, and — wherever applicable — the PMS thread code required for the embroidered look. Nothing gets retyped, which means nothing gets mistyped.',
        },
        {
          key: 'deepdive.variables.2.subhead',
          label: 'Subheading',
          type: 'text',
          default: 'Zones come in the forms production needs:',
        },
        ...namedLines('deepdive.variables.2.items', [
          {
            name: 'Logo',
            text: 'The embroidered logo application, with its technique carried from the library.',
          },
          { name: 'Color', text: 'The thread color callout itself, resolved per team.' },
          { name: 'LineArt', text: 'The outline rendition for spec views.' },
        ]),
        {
          key: 'deepdive.variables.2.p2',
          label: 'Closing paragraph',
          type: 'textarea',
          default:
            'Because embroidery output is colour-critical, these zones work in CMYK — the color mode the downstream process expects.',
        },
        {
          key: 'deepdive.variables.2.why',
          label: 'Why it matters',
          type: 'textarea',
          default:
            "Why it matters: This is the variable where an error costs money. A stale PMS value doesn't get caught in review; it gets caught in production.",
        },
      ],
    },
    {
      section: 'Building Blocks · Dimensions',
      fields: [
        {
          key: 'deepdive.variables.3.title',
          label: 'Heading',
          type: 'text',
          default: 'Dimensions — One design, many bodies',
        },
        {
          key: 'deepdive.variables.3.description',
          label: 'Description',
          type: 'textarea',
          default:
            "The same design doesn't carry the same measurements. A style runs across men's, women's, youth and infant, and each carries its own dimension set — logo heights, placement drops, callout values. Historically, that meant maintaining several near-identical spec sheets by hand and hoping they stayed in sync.",
        },
        {
          key: 'deepdive.variables.3.p2',
          label: 'Second paragraph',
          type: 'textarea',
          default:
            'Dimensions are variables here, so they resolve per size class automatically; and one set can be designated the Master Dimension – the reference the others derive from. Change the Master, and the dependent dimensions follow. You maintain one relationship instead of four separate truths.',
        },
        {
          key: 'deepdive.variables.3.why',
          label: 'Why it matters',
          type: 'textarea',
          default:
            "Why it matters: Dimension drift is the quietest failure in a tech pack — the artwork says one thing, the callout says another, and nobody notices until it's cut.",
        },
      ],
    },
    {
      section: 'Building Blocks · Text',
      fields: [
        {
          key: 'deepdive.variables.4.title',
          label: 'Heading',
          type: 'text',
          default: "Text — Text on licensed product isn't typing. It's construction.",
        },
        {
          key: 'deepdive.variables.4.description',
          label: 'Intro',
          type: 'text',
          default: 'Each kind behaves differently, so each is its own variable:',
        },
        ...namedLines('deepdive.variables.4.items', [
          {
            name: 'Text Spec',
            text: 'Production text. Callouts, colorway names, values. Linked, resolved per team, never retyped. Segmentation added under Text, it detects and segments words, letters, and numbers within artwork, enabling precise processing of design elements commonly used in apparel graphics, jersey numbering, vehicle/cab branding, decals, and custom signage. Each character or design component can be isolated and managed individually for downstream production and customization workflows.',
          },
          {
            name: 'Linear Graphic',
            text: 'A straight wordmark. Set on a baseline, styled, swapped per team.',
          },
          {
            name: 'Contour Graphic',
            text: "Text that follows a path — an arc across a crown, a curve along a seam. The path stays; the team's word flows into it.",
          },
          {
            name: 'Envelope Graphic',
            text: 'Text distorted into a shape. The envelope is the design decision; the wordmark inside it is the variable.',
          },
        ]),
        {
          key: 'deepdive.variables.4.why',
          label: 'Why it matters',
          type: 'textarea',
          default:
            "Why it matters: Every team's name is a different length. A system that only swaps characters, breaks the moment, the word gets longer. These variables hold the construction, so the swap survives.",
        },
      ],
    },
    {
      section: 'Building Blocks · Treatments & Effects',
      fields: [
        {
          key: 'deepdive.variables.5.title',
          label: 'Heading',
          type: 'text',
          default: 'Treatments & Effects — The layer that runs across everything',
        },
        {
          key: 'deepdive.variables.5.description',
          label: 'Description',
          type: 'textarea',
          default:
            'Apparel is not flat color. A region can carry a mask, several fills stacked on one object, several strokes, and a full stack of treatment on top:',
        },
        ...namedLines('deepdive.variables.5.items', [
          {
            name: 'Masks',
            text: 'Uploaded and applied to any region, sized against the content that lands in them, and applicable to strokes as well as fills. Upload any image and use it as a mask for your text or logo. The uploaded image becomes the mask, shaping the artwork beneath it. Then choose how the mask behaves: resize to fit the artwork, keep its original size or repeat as a tiled pattern.',
          },
          {
            name: 'Multiple fills on one object',
            text: 'Build layered construction without shredding the object into pieces.',
          },
          {
            name: 'Multiple strokes',
            text: 'Add and manage stacked outlines with independent control.',
          },
          {
            name: 'Textures and pattern fills',
            text: 'Seamlessly integrate surface treatments into your design.',
          },
          {
            name: 'Shadows, blur, and fade',
            text: 'Preserve depth, dimension, and softness across edits.',
          },
          {
            name: 'Washed and distressed',
            text: 'Achieve authentic vintage and garment-worn finishes.',
          },
          {
            name: 'Glitter and specialty',
            text: 'Apply premium effects that stay attached to each layer.',
          },
        ]),
        {
          key: 'deepdive.variables.5.p2',
          label: 'Closing paragraph',
          type: 'textarea',
          default:
            "Effects target the layer you point them at — a specific fill, a specific stroke, or the whole object. The stack is part of the slot's setup, not something rebuilt per team. Set up a masked, textured, distressed wordmark once, and every team's variant inherits the entire treatment — while each fill and stroke still resolves to that team's correct color.",
        },
        {
          key: 'deepdive.variables.5.why',
          label: 'Why it matters',
          type: 'textarea',
          default:
            'Why it matters: This is the line between a script that duplicates artwork and a tool that reproduces design.',
        },
      ],
    },
    sectionHeader('deepdive.steps', 'How EasyVariants Works', {
      eyebrow: 'How It Works',
      title: 'How EasyVariants Works — Four Steps',
    }),
    {
      section: 'How EasyVariants Works · Steps',
      fields: [
        {
          key: 'deepdive.steps.intro',
          label: 'Intro',
          type: 'text',
          default: 'From hero artwork to a full league.',
        },
        { key: 'deepdive.steps.0.num', label: 'Step 1 number', type: 'text', default: 'Step 01' },
        { key: 'deepdive.steps.0.pickerLabel', label: 'Step 1 tab label', type: 'text', default: 'Logo Library' },
        { key: 'deepdive.steps.0.icon', label: 'Step 1 tab icon', type: 'icon', default: { src: '', name: 'folder_open', color: '' } },
        { key: 'deepdive.steps.1.num', label: 'Step 2 number', type: 'text', default: 'Step 02' },
        { key: 'deepdive.steps.1.pickerLabel', label: 'Step 2 tab label', type: 'text', default: 'The Hero' },
        { key: 'deepdive.steps.1.icon', label: 'Step 2 tab icon', type: 'icon', default: { src: '', name: 'brush', color: '' } },
        { key: 'deepdive.steps.2.num', label: 'Step 3 number', type: 'text', default: 'Step 03' },
        { key: 'deepdive.steps.2.pickerLabel', label: 'Step 3 tab label', type: 'text', default: 'Template' },
        { key: 'deepdive.steps.2.icon', label: 'Step 3 tab icon', type: 'icon', default: { src: '', name: 'grid_view', color: '' } },
        { key: 'deepdive.steps.3.num', label: 'Step 4 number', type: 'text', default: 'Step 04' },
        { key: 'deepdive.steps.3.pickerLabel', label: 'Step 4 tab label', type: 'text', default: 'Generate' },
        { key: 'deepdive.steps.3.icon', label: 'Step 4 tab icon', type: 'icon', default: { src: '', name: 'link', color: '' } },
        {
          key: 'deepdive.steps.0.title',
          label: 'Step 1 heading',
          type: 'text',
          default: 'Migrate the Logo Library',
        },
        {
          key: 'deepdive.steps.0.description',
          label: 'Step 1 text',
          type: 'textarea',
          default:
            "Team's logos live as an Illustrator file, organized by silhouette: a complete collection of team logos, wordmarks, and fashion logos; each carrying its precise dimensions, exact colors, thread specifications, and embroidery application techniques. EasyVariants migrates these into a local repository backed by a database — the single source of truth every variant is generated from.",
        },
        { key: 'deepdive.steps.1.title', label: 'Step 2 heading', type: 'text', default: 'Start From the Hero' },
        {
          key: 'deepdive.steps.1.description',
          label: 'Step 2 text',
          type: 'textarea',
          default:
            'A designer creates the sample artwork — the hero. One design, done properly, at full craft. This is the only artwork anyone draws manually.',
        },
        {
          key: 'deepdive.steps.2.title',
          label: 'Step 3 heading',
          type: 'text',
          default: 'Turn the Hero Into a Template',
        },
        {
          key: 'deepdive.steps.2.description',
          label: 'Step 3 paragraph 1',
          type: 'textarea',
          default:
            'Go through the hero and mark every region that changes from one team to the next. Logo positions become Placement Zones. Recolorable panels become Color Blocks. Stitched areas become Embroidery Zones. Callouts become Dimensions and Text.',
        },
        {
          key: 'deepdive.steps.2.p2',
          label: 'Step 3 paragraph 2',
          type: 'textarea',
          default:
            "Marking a region lifts the team-specific content out of it and leaves a named, empty slot behind. Everything that doesn't change stays exactly as drawn — the silhouette, the construction, the placements, and the spec layout.",
        },
        {
          key: 'deepdive.steps.2.p3',
          label: 'Step 3 paragraph 3',
          type: 'textarea',
          default:
            "Apparel isn't flat color — a region can carry a texture or pattern fill, a mask, multiple fills stacked on one object, a stroke, and effects applied to any of them. All of that is part of the slot's setup, not something you rebuild per team. Mark a masked, textured wordmark once, and the treatment survives every swap.",
        },
        {
          key: 'deepdive.steps.2.p4',
          label: 'Step 3 paragraph 4',
          type: 'textarea',
          default:
            "What you're left with is a blank template, the hero artwork, with its team identity removed. Same design, no team. Just labelled slots, waiting to be filled.",
        },
        { key: 'deepdive.steps.3.title', label: 'Step 4 heading', type: 'text', default: 'Link and Generate' },
        {
          key: 'deepdive.steps.3.intro',
          label: 'Step 4 intro',
          type: 'textarea',
          default:
            'Now point each slot at a team attribute. Instead of "put this logo here," you say "put the team\'s primary logo here."',
        },
        {
          key: 'deepdive.steps.3.items.0',
          label: 'Step 4 list item 1',
          type: 'text',
          default: "Front logo slot → the team's primary logo",
        },
        {
          key: 'deepdive.steps.3.items.1',
          label: 'Step 4 list item 2',
          type: 'text',
          default: "Body or panel fill → the team's secondary color",
        },
        {
          key: 'deepdive.steps.3.items.2',
          label: 'Step 4 list item 3',
          type: 'text',
          default: "Embroidery zone → the team's thread color and PMS code",
        },
        {
          key: 'deepdive.steps.3.description',
          label: 'Step 4 closing',
          type: 'textarea',
          default:
            'Do that once. The template stops describing one team\'s product and starts describing the rule for all of them. Run it, and the plugin fills every slot for every team in the program – Seconds, not days!',
        },
      ],
    },
    sectionHeader('deepdive.craft', 'Craft That Scales', {
      eyebrow: 'Platform',
      title: 'Craft That Scales',
    }),
    {
      section: 'Craft That Scales · Copy',
      fields: [
        {
          key: 'deepdive.craft.p1',
          label: 'Intro paragraph 1',
          type: 'textarea',
          default:
            "Licensed apparel doesn't win on color alone; it wins on finish. The wash on a vintage tee, the stitch, the weathered edge of a heritage crest, and the way a texture sits inside a wordmark instead of behind it — these are the details that separate a real licensed program from a printed logo. They are also, until now, what made scale impossible, because every finish had to be rebuilt by hand, one team at a time.",
        },
        {
          key: 'deepdive.craft.p2',
          label: 'Intro paragraph 2',
          type: 'textarea',
          default:
            'EasyVariants changes the economics of craft. You author the finish once, on the hero, and it travels across the whole program exactly as you made it.',
        },
        { key: 'deepdive.craft.tabs.0', label: 'Tab 1 label', type: 'text', default: 'Masking' },
        { key: 'deepdive.craft.tabs.0.icon', label: 'Tab 1 icon', type: 'icon', default: { src: '', name: 'texture', color: '' } },
        { key: 'deepdive.craft.tabs.1', label: 'Tab 2 label', type: 'text', default: 'Texture' },
        { key: 'deepdive.craft.tabs.1.icon', label: 'Tab 2 icon', type: 'icon', default: { src: '', name: 'grid_on', color: '' } },
        { key: 'deepdive.craft.tabs.2', label: 'Tab 3 label', type: 'text', default: 'Type System' },
        { key: 'deepdive.craft.tabs.2.icon', label: 'Tab 3 icon', type: 'icon', default: { src: '', name: 'format_letter_spacing', color: '' } },
        { key: 'deepdive.craft.tabs.3', label: 'Tab 4 label', type: 'text', default: 'Effects' },
        { key: 'deepdive.craft.tabs.3.icon', label: 'Tab 4 icon', type: 'icon', default: { src: '', name: 'blur_on', color: '' } },
        { key: 'deepdive.craft.tabs.4', label: 'Tab 5 label', type: 'text', default: 'Summary' },
        { key: 'deepdive.craft.tabs.4.icon', label: 'Tab 5 icon', type: 'icon', default: { src: '', name: 'verified', color: '' } },
        { key: 'deepdive.craft.headings.0', label: 'Panel 1 heading', type: 'text', default: 'Masking' },
        {
          key: 'deepdive.craft.p3',
          label: 'Masking text',
          type: 'textarea',
          default:
            'It starts with masking. Upload any image and it becomes a mask for a logo, a wordmark, or a fill. Then you make one decision about how it should behave. Fit it, and the mask locks to the exact bounds of whatever lands inside. Scale it, and it resizes as the content changes, covering a four-letter city as cleanly as a twelve-letter one. Tile it, and the mask repeats across the shape, so a pattern or print fills the letterform edge to edge at any size. One choice on the template, and every variant gets the right result.',
        },
        { key: 'deepdive.craft.headings.1', label: 'Panel 2 heading', type: 'text', default: 'Texture' },
        {
          key: 'deepdive.craft.p4',
          label: 'Texture text',
          type: 'textarea',
          default:
            "Texture layers on top of that. Any surface a brand can picture — whether it's a canvas weave, a cracked vintage print, a woven twill, or a soft grain — can be applied to any region and carried as part of the design itself. It isn't pasted onto one team's artwork; it's built into the slot, so it reproduces with the same fidelity across the entire roster while every element still resolves to its own team color.",
        },
        { key: 'deepdive.craft.headings.2', label: 'Panel 3 heading', type: 'text', default: 'Type System' },
        {
          key: 'deepdive.craft.p5',
          label: 'Type system text',
          type: 'textarea',
          default:
            "Change the font on the fly and every variant follows. Split a wordmark into parts — whether that's an established year set as 19 and 69 on either side of a crest, a two-letter city broken and placed apart, or a team name divided across the chest — and each fragment becomes its own placement with its own position, size, and treatment. The name stops being a fixed string; it becomes a system that reflows for every team, whatever the length and whatever the shape.",
        },
        { key: 'deepdive.craft.headings.3', label: 'Panel 4 heading', type: 'text', default: 'Effects Stack' },
        {
          key: 'deepdive.craft.p6',
          label: 'Effects text',
          type: 'textarea',
          default:
            'Then come the effects. Once the type is set, the mask applied, and the texture chosen, the full depth of the appearance stack is yours on any layer. A drop shadow for dimension. A grain for wear. A zig-zag for a torn edge, a blur for a fade, a warp for a contoured surface. Each effect targets exactly the layer you point it at, whether that\'s a single fill or the whole object, and it holds its place while the color underneath changes from one team to the next. Stack them, save the look, and the whole treatment travels together: mask, texture, type, and effect as one.',
        },
        { key: 'deepdive.craft.headings.4', label: 'Panel 5 heading', type: 'text', default: 'The Platform Difference' },
        {
          key: 'deepdive.craft.p7',
          label: 'Summary text',
          type: 'textarea',
          default:
            "This is the difference between a tool that copies artwork and a platform that reproduces design. A designer sets the intent once — from the mask behavior to the texture, to the type system, to the finish — and EasyVariants carries that intent faithfully across the full breadth of a license. The craft stays in the designer's hands; the multiplication becomes the machine's.",
        },
        {
          key: 'deepdive.craft.tagline',
          label: 'Tagline',
          type: 'text',
          default: 'Build it once, at full craft. Ship it to the whole league!',
        },
      ],
    },
    sectionHeader('demos', 'Demo Videos', {
      eyebrow: 'Seeing is Believing',
      title: 'Demo Videos',
      description:
        'Explore enterprise-ready design automation flows built for high-volume manufacturing environments.',
    }),
    {
      section: 'Demo Videos · YouTube list',
      fields: [
        {
          key: 'demos.videos',
          label: 'Demo videos (YouTube)',
          type: 'list',
          listItemLabel: 'Video',
          itemFields: [
            { key: 'youtubeId', label: 'YouTube video ID', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'label', label: 'Short label', type: 'text' },
          ],
          default: [
            { youtubeId: 'Mrj4YI_RQzA', title: 'EasyVariants Demo  Product Variants', label: 'Product Variants' },
            { youtubeId: 'Kd0Olg1cE-s', title: 'EasyVariants Demo  Cap Variants', label: 'Cap Variants' },
            { youtubeId: '2Zl_BkN9L6w', title: 'EasyVariants Explainer Video', label: 'Explainer Video' },
            { youtubeId: 'ETiWWJaoaZM', title: 'EasyVariants Demo  Sweatshirt Variants', label: 'Sweatshirt Variants' },
            { youtubeId: 'l5tyQAdNiEY', title: 'EasyVariants Demo  Shoe Variants', label: 'Shoe Variants' },
          ],
        },
      ],
    },
    sectionHeader('fits', 'Where It Fits', {
      eyebrow: 'Applications',
      title: 'Where EasyVariants Fits',
      description:
        "EasyVariants was born in headwear, but the variable system doesn't care what the silhouette is. Anywhere a single approved design has to be reproduced across a roster of teams – with team logos, team colors, team-specific text and production-accurate embroidery – the same engine applies.",
    }),
    {
      section: 'Where It Fits · Product types',
      fields: [
        { key: 'fits.productsHeading', label: 'Product types heading', type: 'text', default: 'By Product Type' },
        ...cardFields('fits.products', [
          {
            title: 'Headwear',
            description:
              'Where it started, and is still the densest test of the system. Fitted, snapback, trucker, and dad-cap silhouettes, each with front logo, side hit, back closure, and undervisor placements. Multiple embroidery zones per cap, precise thread and PMS callouts, and crown-panel recolors that all have to stay in register across a full team roster.',
            icon: { name: 'checkroom', color: '#3525cd' },
          },
          {
            title: 'Jerseys',
            description:
              'Chest crest, sleeve numbers, nameplate, and manufacturer marks – each its own placement, each resolving per team. Nameplate text splits and reflows for names of every length, and the twill and applique construction rides along as treatment on the fill.',
            icon: { name: 'sports_soccer', color: '#3525cd' },
          },
          {
            title: 'T-shirts & Tees',
            description:
              'Front graphic, back print, sleeve hit, and left-chest logo. Screenprint and distressed-finish treatments – grain, wash, fade – carried as effects that reproduce identically on every team\'s version.',
            icon: { name: 'styler', color: '#3525cd' },
          },
          {
            title: 'Polos & Performance',
            description:
              'Clean, embroidery-first layouts. Left-chest logo, sleeve mark, and collar detail – the zone where thread color and PMS accuracy matter most, and where a stale swatch is most visible.',
            icon: { name: 'dry_cleaning', color: '#3525cd' },
          },
          {
            title: 'Jackets & Outerwear',
            description:
              'Back panels, chest crests, sleeve wordmarks, and zip-placket detailing. Multiple large placements per piece, often mixing embroidery, applique, and print in a single garment – exactly the multi-treatment case the appearance stack is built for.',
            icon: { name: 'apparel', color: '#3525cd' },
          },
          {
            title: 'Accessories',
            description:
              'Bags, beanies, scarves, and patches. Small formats where a single logo or wordmark carries the whole design, and where volume across a league still makes manual replication expensive.',
            icon: { name: 'shopping_bag', color: '#3525cd' },
          },
        ]),
      ],
    },
    {
      section: 'Where It Fits · Use cases',
      fields: cardFields('fits.usecases', [
        {
          title: 'Seasonal Lines',
          description:
            'Product that changes regularly, where the cost of manual replication compounds with every new style.',
          icon: { name: 'calendar_month', color: '#3525cd' },
        },
        {
          title: 'Evergreen Product',
          description: 'The designs that relaunch season after season, where a template built once keeps paying out.',
          icon: { name: 'autorenew', color: '#3525cd' },
        },
        {
          title: 'Prototypes & Customs',
          description:
            'Even a simple, single-color piece needs a prototype before an order lands. EasyVariants makes it cheap enough to produce one.',
          icon: { name: 'science', color: '#3525cd' },
        },
      ]),
    },
    {
      section: 'Final CTA',
      fields: [
        { key: 'cta.title', label: 'Heading', type: 'text', default: 'Ready to Design Smarter?' },
        {
          key: 'cta.description',
          label: 'Description',
          type: 'textarea',
          default:
            'Reduce production-cycle bottlenecks, scale variant output across factories, and enforce brand consistency across every product line.',
        },
        { key: 'cta.button.label', label: 'Button label', type: 'text', default: 'Request a Demo Today' },
        { key: 'cta.button.href', label: 'Button link', type: 'text', default: 'contactus.html' },
        { key: 'cta.footer', label: 'Footer line', type: 'text', default: "Let's automate your product variants." },
      ],
    },
    {
      section: 'Footer',
      fields: [
        {
          key: 'footer.brand.description',
          label: 'Brand description',
          type: 'textarea',
          default:
            'Enterprise design automation for large manufacturers. Scale product variants across global operations with controlled, repeatable workflows.',
        },
        { key: 'footer.menuTitle', label: 'Menu heading', type: 'text', default: 'Menu' },
        { key: 'footer.socialTitle', label: 'Quick links heading', type: 'text', default: 'Quick Links' },
        { key: 'footer.email.icon', label: 'Email card icon', type: 'icon', default: { src: '', name: 'mail', color: '' } },
        { key: 'footer.email.title', label: 'Email card heading', type: 'text', default: 'Email Us' },
        { key: 'footer.email.address', label: 'Email address', type: 'text', default: 'hello@easyvariants.com' },
        {
          key: 'footer.email.href',
          label: 'Email link',
          type: 'text',
          default: 'mailto:hello@easyvariants.com',
        },
        { key: 'footer.support.icon', label: 'Support card icon', type: 'icon', default: { src: '', name: 'support_agent', color: '' } },
        { key: 'footer.support.title', label: 'Support card heading', type: 'text', default: 'Dedicated Support' },
        {
          key: 'footer.support.text',
          label: 'Support card text',
          type: 'text',
          default: 'Our team is here to help you every step of the way.',
        },
        { key: 'footer.copyright', label: 'Copyright line', type: 'text', default: '© 2026 EasyVariants. All Rights Reserved.' },
        {
          key: 'footer.disclaimer',
          label: 'Disclaimer',
          type: 'text',
          default: 'Adobe Illustrator® is a trademark of Adobe Inc. EasyVariants is not affiliated.',
        },
      ],
    },
    {
      section: 'Footer · Menu links',
      fields: linkFields('footer.menu', [
        { label: 'Home', href: '#home' },
        { label: 'Our Solution', href: '#solution' },
        { label: 'Workflow', href: '#how-it-works' },
        { label: 'Demo Videos', href: '#demos' },
      ]),
    },
    {
      section: 'Footer · Social links',
      fields: linkFields('footer.social', [
        { label: 'LinkedIn', href: 'https://www.linkedin.com/company/xinthe-technologies/' },
        { label: 'Youtube', href: 'https://www.youtube.com/@xinthetechnologies6321' },
        { label: 'facebook', href: 'https://facebook.com/xintheemployees' },
        { label: 'X', href: 'https://x.com/xinthetech' },
      ]),
    },
  ],
  contact: [
    {
      section: 'Page header',
      fields: [
        { key: 'contact.badge', label: 'Badge', type: 'text', default: 'Request a Demo' },
        { key: 'contact.title.line1', label: 'Title line 1', type: 'text', default: "Let's Build" },
        { key: 'contact.title.line2', label: 'Title line 2', type: 'text', default: 'Something Great' },
        {
          key: 'contact.description',
          label: 'Intro description',
          type: 'textarea',
          default:
            'See how EasyVariants can automate your design workflow, save time, and scale your product variants effortlessly.',
        },
      ],
    },
    {
      section: 'Contact form',
      fields: [
        { key: 'contact.form.title', label: 'Form heading', type: 'text', default: 'Send us a message' },
        {
          key: 'contact.form.subtitle',
          label: 'Form subtitle',
          type: 'text',
          default: 'Fill out the form and our team will get back to you within 24 hours.',
        },
        { key: 'contact.form.firstName.label', label: 'First name heading', type: 'text', default: 'First Name' },
        { key: 'contact.form.firstName.placeholder', label: 'First name placeholder', type: 'text', default: 'John' },
        { key: 'contact.form.lastName.label', label: 'Last name heading', type: 'text', default: 'Last Name' },
        { key: 'contact.form.lastName.placeholder', label: 'Last name placeholder', type: 'text', default: 'Doe' },
        { key: 'contact.form.email.label', label: 'Email heading', type: 'text', default: 'Email Address' },
        {
          key: 'contact.form.email.placeholder',
          label: 'Email placeholder',
          type: 'text',
          default: 'john@company.com',
        },
        { key: 'contact.form.company.label', label: 'Company heading', type: 'text', default: 'Company (Optional)' },
        { key: 'contact.form.company.placeholder', label: 'Company placeholder', type: 'text', default: 'Acme Corp' },
        { key: 'contact.form.message.label', label: 'Message heading', type: 'text', default: 'Message' },
        {
          key: 'contact.form.message.placeholder',
          label: 'Message placeholder',
          type: 'text',
          default: 'Tell us about your project or how we can help...',
        },
        { key: 'contact.form.submit', label: 'Submit button', type: 'text', default: 'Send Message' },
        {
          key: 'contact.form.success',
          label: 'Success message',
          type: 'text',
          default: "Message sent successfully! We'll be in touch soon.",
        },
        {
          key: 'contact.form.error',
          label: 'Error message',
          type: 'text',
          default: 'Something went wrong. Please try again.',
        },
      ],
    },
    {
      section: 'Info cards',
      fields: [
        { key: 'contact.info.0.title', label: 'Email card heading', type: 'text', default: 'Email Us' },
        { key: 'contact.info.0.description', label: 'Email card text', type: 'text', default: 'hello@easyvariants.com' },
        { key: 'contact.info.0.icon', label: 'Email card icon', type: 'icon', default: { src: '', name: 'mail', color: '#3525cd' } },
        { key: 'contact.info.1.title', label: 'Response time heading', type: 'text', default: 'Response Time' },
        {
          key: 'contact.info.1.description',
          label: 'Response time text',
          type: 'textarea',
          default: 'We typically respond within 24 hours on business days.',
        },
        { key: 'contact.info.1.icon', label: 'Response time icon', type: 'icon', default: { src: '', name: 'schedule', color: '#3525cd' } },
        { key: 'contact.info.2.title', label: 'Live demo heading', type: 'text', default: 'Live Demo' },
        {
          key: 'contact.info.2.description',
          label: 'Live demo text',
          type: 'textarea',
          default: 'Get a personalized walkthrough of the platform, tailored to your use case.',
        },
        { key: 'contact.info.2.icon', label: 'Live demo icon', type: 'icon', default: { src: '', name: 'devices', color: '#3525cd' } },
        { key: 'contact.info.3.title', label: 'Support heading', type: 'text', default: 'Dedicated Support' },
        {
          key: 'contact.info.3.description',
          label: 'Support text',
          type: 'textarea',
          default: 'Our team is here to help you every step of the way.',
        },
        { key: 'contact.info.3.icon', label: 'Support icon', type: 'icon', default: { src: '', name: 'support_agent', color: '#3525cd' } },
      ],
    },
    {
      section: 'Quick stats',
      fields: [
        { key: 'contact.stats.0.value', label: 'Stat 1 value', type: 'text', default: '500+' },
        { key: 'contact.stats.0.label', label: 'Stat 1 heading', type: 'text', default: 'Teams Served' },
        { key: 'contact.stats.1.value', label: 'Stat 2 value', type: 'text', default: '24hr' },
        { key: 'contact.stats.1.label', label: 'Stat 2 heading', type: 'text', default: 'Avg Reply' },
      ],
    },
  ],
};

/** Flatten schema defaults into { key: block } for seeding / form prefill. */
export function schemaDefaults(page) {
  const sections = CMS_SCHEMA[page] || [];
  const blocks = {};
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.default === undefined) continue;
      if (field.type === 'image' || field.type === 'video' || field.type === 'icon') {
        blocks[field.key] = { type: field.type, value: field.default };
      } else if (field.type === 'list') {
        blocks[field.key] = { type: 'list', value: field.default };
      } else {
        blocks[field.key] = { type: 'text', value: String(field.default) };
      }
    }
  }
  return blocks;
}

export function getAllowedKeysForPage(page) {
  const keys = new Set();
  for (const section of CMS_SCHEMA[page] || []) {
    for (const field of section.fields) {
      keys.add(field.key);
    }
  }
  return keys;
}

export const ALLOWED_CMS_KEYS = {
  home: getAllowedKeysForPage('home'),
  contact: getAllowedKeysForPage('contact'),
};

export function getFieldDef(page, key) {
  for (const section of CMS_SCHEMA[page] || []) {
    const field = section.fields.find((f) => f.key === key);
    if (field) return field;
  }
  return null;
}

export function getFieldLabelMap(page) {
  const map = {};
  for (const section of CMS_SCHEMA[page] || []) {
    for (const field of section.fields) {
      map[field.key] = field.label;
    }
  }
  return map;
}
