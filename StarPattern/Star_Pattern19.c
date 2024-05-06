#include <stdio.h>
int main()//ลูกศรชี้ทางทิศตะวันตกเฉียงใต้//
{
    int n,i,j;
    scanf("%d",&n);
    for(i=0;i<n/2;i++)
    {
        for(j=0;j<=i;j++) printf("* ");
        for(j=n-2*i;j>=3;j--)printf("  ");
        printf("*\n");
    }
    for(i=n/2;i<n;i++)
    {
        for(j=0;j<=i;j++) printf("* ");
        printf("\n");
    }
}