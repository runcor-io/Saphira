'use client';

import { useState } from 'react';
import { Building2, Briefcase, Landmark, Smartphone, Banknote, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Country, getAllCompanies, getCompanyInfo } from '@/lib/saphira/verifiedDataset';

interface CompanySelectorProps {
  country: Country;
  selectedCompany: string;
  onSelect: (company: string) => void;
  onStart: () => void;
}

const COMPANY_ICONS: Record<string, React.ReactNode> = {
  GTBank: <Landmark className="w-6 h-6" />,
  Access_Bank: <Landmark className="w-6 h-6" />,
  Flutterwave: <Smartphone className="w-6 h-6" />,
  Paystack: <Banknote className="w-6 h-6" />,
  Safaricom: <Smartphone className="w-6 h-6" />,
  Equity_Bank: <Landmark className="w-6 h-6" />,
  KCB: <Landmark className="w-6 h-6" />,
  Standard_Bank: <Landmark className="w-6 h-6" />,
  FNB: <Landmark className="w-6 h-6" />,
  MTN: <Smartphone className="w-6 h-6" />,
  Nedbank: <Landmark className="w-6 h-6" />,
  general: <Briefcase className="w-6 h-6" />,
};

export default function CompanySelector({ 
  country, 
  selectedCompany, 
  onSelect, 
  onStart 
}: CompanySelectorProps) {
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  
  const allCompanies = getAllCompanies();
  const countryCompanies = allCompanies.filter(c => c.country === country || c.id === 'general');
  
  const selectedCompanyInfo = selectedCompany !== 'general' 
    ? getCompanyInfo(selectedCompany, country)
    : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-charcoal mb-2">Choose Interview Focus</h2>
        <p className="text-gray-500">Select a company to practice with real interview questions</p>
      </div>

      {/* Company Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {countryCompanies.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelect(company.id)}
            onMouseEnter={() => setHoveredCompany(company.id)}
            onMouseLeave={() => setHoveredCompany(null)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedCompany === company.id
                ? 'border-wood bg-wood/5'
                : 'border-gray-200 hover:border-wood/50 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                selectedCompany === company.id ? 'bg-wood text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {COMPANY_ICONS[company.id] || <Building2 className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-charcoal truncate">
                  {company.name}
                </h3>
                {company.id !== 'general' && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {company.country === 'nigeria' ? '🇳🇬 Nigeria' : 
                     company.country === 'kenya' ? '🇰🇪 Kenya' : '🇿🇦 South Africa'}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Company Info */}
      {selectedCompanyInfo && (
        <Card className="bg-wood/5 border-wood">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {COMPANY_ICONS[selectedCompany]}
              {selectedCompanyInfo.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedCompanyInfo.core_values && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Core Values:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCompanyInfo.core_values.slice(0, 4).map((value, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {selectedCompanyInfo.interview_stages && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Interview Process:</p>
                <div className="space-y-2">
                  {selectedCompanyInfo.interview_stages.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-wood text-white text-xs flex items-center justify-center">
                        {stage.stage}
                      </span>
                      <span className="text-gray-600">{stage.name}</span>
                      {stage.duration && (
                        <span className="text-gray-400 text-xs">({stage.duration})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCompanyInfo.focus && (
              <div>
                <p className="text-sm font-medium text-gray-700">Focus Areas:</p>
                <p className="text-sm text-gray-600">{selectedCompanyInfo.focus}</p>
              </div>
            )}

            <div className="pt-2">
              <p className="text-sm text-wood font-medium">
                {selectedCompanyInfo.questions?.length || 10}+ real interview questions available
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Practice Info */}
      {selectedCompany === 'general' && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              General Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Practice with a mix of common {country === 'nigeria' ? 'Nigerian' : country === 'kenya' ? 'Kenyan' : 'South African'} interview questions 
              across various categories including personality, technical, and behavioral questions.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">Traditional Questions</Badge>
              <Badge variant="secondary">Banking</Badge>
              <Badge variant="secondary">Tough Questions</Badge>
              <Badge variant="secondary">Cultural Fit</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Button */}
      <Button 
        onClick={onStart}
        className="w-full bg-wood hover:bg-wood-dark text-white py-6 text-lg"
      >
        Start Interview with {selectedCompany === 'general' ? 'General Practice' : selectedCompanyInfo?.name}
      </Button>
    </div>
  );
}
