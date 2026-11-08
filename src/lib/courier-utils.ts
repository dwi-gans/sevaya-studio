/**
 * Courier detection utility
 * Extracts exact Biteship courier company and service code directly from order data.
 * Guarantees admin pickups automatically follow whatever courier customer chose and paid for.
 */

export interface DetectedCourier {
  company: string; // e.g. 'jne', 'jnt', 'sicepat', 'anteraja', 'tiki', 'pos', 'grab', 'gojek'
  companyName: string; // e.g. 'JNE', 'J&T Express', 'SiCepat', 'AnterAja', 'TIKI', 'Pos Indonesia', 'Grab', 'Gojek'
  service: string; // e.g. 'reg', 'ez', 'siunt', etc.
  serviceName: string; // e.g. 'REG', 'EZ', 'BEST', etc.
}

export function detectOrderCourier(order: {
  courier_name?: string | null;
  courier_service?: string | null;
}): DetectedCourier {
  const name = (order.courier_name || '').toLowerCase();
  const srv = (order.courier_service || '').toLowerCase();

  let company = 'jne';
  let companyName = 'JNE';

  if (name.includes('j&t') || name.includes('jnt')) {
    company = 'jnt';
    companyName = 'J&T Express';
  } else if (name.includes('sicepat')) {
    company = 'sicepat';
    companyName = 'SiCepat';
  } else if (name.includes('anteraja')) {
    company = 'anteraja';
    companyName = 'AnterAja';
  } else if (name.includes('tiki')) {
    company = 'tiki';
    companyName = 'TIKI';
  } else if (name.includes('pos')) {
    company = 'pos';
    companyName = 'Pos Indonesia';
  } else if (name.includes('grab')) {
    company = 'grab';
    companyName = 'Grab';
  } else if (name.includes('gojek') || name.includes('gosend')) {
    company = 'gojek';
    companyName = 'Gojek';
  } else if (name.includes('jne')) {
    company = 'jne';
    companyName = 'JNE';
  }

  // Detect service code
  let service = 'reg';
  let serviceName = (order.courier_service || 'REG').toUpperCase();

  if (company === 'jnt') {
    if (srv.includes('ez') || name.includes('ez')) service = 'ez';
    else if (srv.includes('jtreg') || name.includes('jtreg')) service = 'jtreg';
    else service = 'ez';
    serviceName = service.toUpperCase();
  } else if (company === 'sicepat') {
    if (srv.includes('best') || name.includes('best')) service = 'best';
    else if (srv.includes('gokil') || name.includes('gokil') || name.includes('cargo')) service = 'gokil';
    else service = 'siunt';
    serviceName = service === 'siunt' ? 'REG (SIUNT)' : service.toUpperCase();
  } else if (company === 'anteraja') {
    if (srv.includes('next') || name.includes('next')) service = 'next';
    else if (srv.includes('same') || name.includes('same')) service = 'same';
    else service = 'reg';
    serviceName = service.toUpperCase();
  } else if (company === 'jne') {
    if (srv.includes('yes') || name.includes('yes')) service = 'yes';
    else if (srv.includes('oke') || name.includes('oke')) service = 'oke';
    else if (srv.includes('jtr') || name.includes('jtr') || name.includes('cargo')) service = 'jtr';
    else service = 'reg';
    serviceName = service.toUpperCase();
  } else if (company === 'tiki') {
    if (srv.includes('ons') || name.includes('ons')) service = 'ons';
    else if (srv.includes('eco') || name.includes('eco')) service = 'eco';
    else service = 'reg';
    serviceName = service.toUpperCase();
  } else if (company === 'grab' || company === 'gojek') {
    service = 'instant';
    serviceName = 'INSTANT';
  }

  return { company, companyName, service, serviceName };
}
