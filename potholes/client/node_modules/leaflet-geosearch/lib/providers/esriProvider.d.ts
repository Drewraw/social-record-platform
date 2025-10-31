import AbstractProvider, { EndpointArgument, ParseArgument, SearchResult } from './provider';
export interface RequestResult {
    spatialReference: {
        wkid: number;
        latestWkid: number;
    };
    locations: RawResult[];
}
export interface RawResult {
    name: string;
    extent: {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
    };
    feature: {
        geometry: {
            x: number;
            y: number;
        };
        attributes: {
            Score: number;
            Addr_Type: string;
        };
    };
}
export default class EsriProvider extends AbstractProvider<RequestResult, RawResult> {
    searchUrl: string;
    endpoint({ query }: EndpointArgument): string;
    parse(result: ParseArgument<RequestResult>): SearchResult<RawResult>[];
}
