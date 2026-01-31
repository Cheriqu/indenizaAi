import svgPaths from "./svg-bjtqosdgdf";

function Heading() {
  return (
    <div className="absolute h-[72px] left-[255px] top-[80px] w-[1024px]" data-name="Heading 2">
      <p className="-translate-x-1/2 absolute css-ew64yg font-['Archivo:Bold',sans-serif] font-bold leading-[72px] left-[512.63px] text-[#0f172a] text-[48px] text-center top-0 tracking-[-1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Casos de sucesso
      </p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[28px] left-[431px] top-[164px] w-[672px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute css-ew64yg font-['Inter:Regular',sans-serif] font-normal leading-[28px] left-[336.41px] not-italic text-[#64748b] text-[18px] text-center top-0">Veja quanto nossos usuários já recuperaram</p>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.pf1e1580} fill="var(--fill-0, #A3C852)" id="Vector" stroke="var(--stroke-0, #A3C852)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-[4px] h-[24px] items-start relative shrink-0 w-full" data-name="Container">
      {[...Array(5).keys()].map((_, i) => (
        <Icon key={i} />
      ))}
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[65px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[32.5px] left-0 not-italic text-[20px] text-white top-[-1px] w-[843px]">{`"Descobri um empréstimo no meu nome que nunca fiz. A IndenizaAí me ajudou a provar e consegui a indenização em 3 meses!"`}</p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute css-ew64yg font-['Archivo:Bold',sans-serif] font-bold leading-[32px] left-0 text-[24px] text-white top-0" style={{ fontVariationSettings: "'wdth' 100" }}>
        Maria Silva
      </p>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute css-ew64yg font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#dbeafe] text-[16px] top-[-1px]">São Paulo, SP</p>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#dbeafe] text-[16px] top-[-1px] w-[233px]">📋 Empréstimo não contratado</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[96px] relative shrink-0 w-[232.656px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <Paragraph2 />
        <Paragraph3 />
        <Paragraph4 />
      </div>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute css-ew64yg font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#dbeafe] text-[14px] top-0">Valor recuperado</p>
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="h-[48px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute css-ew64yg font-['Archivo:Bold',sans-serif] font-bold leading-[48px] left-0 text-[#a3c852] text-[48px] top-0" style={{ fontVariationSettings: "'wdth' 100" }}>
        R$ 8.500
      </p>
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] h-[126px] relative rounded-[16px] shrink-0 w-[250.172px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start pb-px pt-[25px] px-[25px] relative size-full">
        <Paragraph5 />
        <Paragraph6 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex h-[126px] items-end justify-between relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Container4() {
  return (
    <div className="bg-gradient-to-b from-[#1c80b2] h-[367px] relative rounded-[24px] shadow-[0px_20px_60px_0px_rgba(28,128,178,0.25)] shrink-0 to-[#165f8a] w-full" data-name="Container">
      <div className="content-stretch flex flex-col gap-[24px] items-start pt-[48px] px-[48px] relative size-full">
        <Container />
        <Paragraph1 />
        <Container3 />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d="M15 18L9 12L15 6" id="Vector" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-white relative rounded-[33554400px] shrink-0 size-[48px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-2 border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-[2px] relative size-full">
        <Icon1 />
      </div>
    </div>
  );
}

function Button1() {
  return <div className="bg-[#1c80b2] flex-[1_0_0] h-[8px] min-h-px min-w-px rounded-[33554400px]" data-name="Button" />;
}

function Button2() {
  return <div className="bg-[#64748b] opacity-30 rounded-[33554400px] shrink-0 size-[8px]" data-name="Button" />;
}

function Container5() {
  return (
    <div className="h-[48px] relative shrink-0 w-[80px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Button1 />
        {[...Array(3).keys()].map((_, i) => (
          <Button2 key={i} />
        ))}
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d="M9 18L15 12L9 6" id="Vector" stroke="var(--stroke-0, #64748B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-white relative rounded-[33554400px] shrink-0 size-[48px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-2 border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-[2px] relative size-full">
        <Icon2 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex gap-[16px] h-[48px] items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Button />
      <Container5 />
      <Button3 />
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] h-[447px] items-start left-[255px] top-[256px] w-[1024px]" data-name="Container">
      <Container4 />
      <Container6 />
    </div>
  );
}

export default function SuccessCases() {
  return (
    <div className="bg-white relative size-full" data-name="SuccessCases">
      <Heading />
      <Paragraph />
      <Container7 />
    </div>
  );
}